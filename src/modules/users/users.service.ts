import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import sharp from 'sharp';
import { InjectRepository } from '@nestjs/typeorm';
import { SUPABASE_ADMIN_CLIENT } from '../supabase/supabase.module';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Repository } from 'typeorm';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { User } from './entities/User.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import type { ProfilePhotoFile } from './types/profile-photo-file';
import type {
  UpdateUserProfileResponse,
  UserMeResponse,
} from './types/user-response';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private static readonly MAX_INPUT_FILE_SIZE = 8 * 1024 * 1024;
  private static readonly MAX_INPUT_PIXELS = 16_000_000;
  private static readonly MAX_OUTPUT_FILE_SIZE = 300 * 1024;
  private static readonly OUTPUT_MAX_DIMENSION = 768;
  private static readonly allowedMimeTypes = new Map([
    ['image/jpeg', 'jpeg'],
    ['image/png', 'png'],
    ['image/webp', 'webp'],
  ]);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @Inject(SUPABASE_ADMIN_CLIENT)
    private readonly supabaseAdmin: SupabaseClient,
    private readonly configService: ConfigService,
  ) {}

  async upsertFromSupabaseUser(supabaseUser: SupabaseUser): Promise<User> {
    if (!supabaseUser.email) {
      throw new BadRequestException('El usuario de Supabase no tiene email');
    }

    const existingUser = await this.usersRepository.findOneBy({
      id: supabaseUser.id,
    });

    const nombre = this.pickSupabaseString(
      supabaseUser.user_metadata?.name,
      supabaseUser.user_metadata?.full_name,
      supabaseUser.user_metadata?.username,
    );
    const foto = this.pickSupabaseString(
      supabaseUser.user_metadata?.avatar_url,
      supabaseUser.user_metadata?.picture,
    );
    const telefono = this.pickSupabaseString(
      supabaseUser.user_metadata?.phone,
      supabaseUser.user_metadata?.telefono,
    );

    const profile = this.usersRepository.create({
      ...(existingUser ?? {}),
      id: supabaseUser.id,
      correo: supabaseUser.email,
      telefono: telefono ?? existingUser?.telefono ?? undefined,
      nombre: nombre ?? existingUser?.nombre ?? undefined,
      foto: existingUser?.foto ?? foto ?? undefined,
    });

    return this.usersRepository.save(profile);
  }

  private pickSupabaseString(...values: Array<unknown>): string | undefined {
    for (const value of values) {
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed) {
          return trimmed;
        }
      }
    }

    return undefined;
  }

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ id });
  }

  async getProfile(userId: string): Promise<UserMeResponse> {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return this.toUserMeResponse(user);
  }

  async isProfileComplete(userId: string): Promise<boolean> {
    const user = await this.usersRepository
      .createQueryBuilder('usuario')
      .select([
        'usuario.id',
        'usuario.nombre',
        'usuario.telefono',
        'usuario.correo',
        'usuario.tipoDocumento',
        'usuario.numeroDocumento',
      ])
      .where('usuario.id = :userId', { userId })
      .getOne();

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return Boolean(
      user.nombre?.trim() &&
      user.telefono?.trim() &&
      user.correo?.trim() &&
      user.tipoDocumento &&
      user.numeroDocumento?.trim(),
    );
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
    photoFile?: ProfilePhotoFile,
  ): Promise<UpdateUserProfileResponse> {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const previousPhoto = user.foto ?? null;
    const shouldDeletePhoto = dto.foto === null || dto.eliminarFoto === true;

    if (photoFile && shouldDeletePhoto) {
      throw new BadRequestException(
        'No puedes subir una foto y solicitar su eliminación al mismo tiempo',
      );
    }

    let uploadedPhotoPath: string | null = null;

    if (photoFile) {
      uploadedPhotoPath = await this.uploadProfilePhoto(userId, photoFile);
    }

    // Solo aplicamos campos realmente enviados para no alterar los omitidos.
    const updates = Object.fromEntries(
      Object.entries(dto).filter(
        ([key, value]) =>
          value !== undefined && key !== 'foto' && key !== 'eliminarFoto',
      ),
    );

    if (uploadedPhotoPath) {
      updates.foto = uploadedPhotoPath;
    } else if (shouldDeletePhoto) {
      updates.foto = null;
    }

    Object.assign(user, updates);

    let updatedUser: User;
    try {
      await this.usersRepository.save(user);

      const savedUser = await this.findById(userId);

      if (!savedUser) {
        throw new NotFoundException('Usuario no encontrado');
      }

      updatedUser = savedUser;
    } catch (error) {
      if (uploadedPhotoPath) {
        await this.removeStorageObject(uploadedPhotoPath);
      }

      if (this.isPostgresUniqueViolation(error)) {
        throw new ConflictException(
          'El telefono o numero de documento ya está registrado',
        );
      }

      throw error;
    }

    await this.cleanupPreviousPhoto(previousPhoto, updatedUser.foto ?? null);

    return this.toUpdateUserProfileResponse(updatedUser);
  }

  private async uploadProfilePhoto(
    userId: string,
    photoFile: ProfilePhotoFile,
  ): Promise<string> {
    if (photoFile.size > UsersService.MAX_INPUT_FILE_SIZE) {
      throw new BadRequestException('La foto no puede superar 8 MB');
    }

    const expectedFormat = UsersService.allowedMimeTypes.get(
      photoFile.mimetype,
    );
    if (!expectedFormat) {
      throw new BadRequestException(
        'La foto debe ser un archivo JPEG, PNG o WebP',
      );
    }

    let metadata: sharp.Metadata;
    try {
      metadata = await sharp(photoFile.buffer, {
        limitInputPixels: UsersService.MAX_INPUT_PIXELS,
        animated: false,
      }).metadata();
    } catch {
      throw new BadRequestException('El archivo no es una imagen válida');
    }

    if (
      !metadata.width ||
      !metadata.height ||
      metadata.width * metadata.height > UsersService.MAX_INPUT_PIXELS
    ) {
      throw new BadRequestException(
        'La imagen supera las dimensiones permitidas',
      );
    }

    if (metadata.format !== expectedFormat || (metadata.pages ?? 1) > 1) {
      throw new BadRequestException(
        'El contenido de la imagen no coincide con el formato permitido',
      );
    }

    const optimizedPhoto = await this.optimizeProfilePhoto(photoFile.buffer);
    const photoPath = `${userId}/${randomUUID()}.webp`;
    const bucket = this.getProfileBucket();

    const { error } = await this.supabaseAdmin.storage
      .from(bucket)
      .upload(photoPath, optimizedPhoto, {
        contentType: 'image/webp',
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      this.logger.error(
        `No se pudo subir la foto de perfil del usuario ${userId}: ${error.message}`,
      );
      throw new BadRequestException('No se pudo guardar la foto de perfil');
    }

    return photoPath;
  }

  private async optimizeProfilePhoto(input: Buffer): Promise<Buffer> {
    const variants = [
      { dimension: UsersService.OUTPUT_MAX_DIMENSION, quality: 82 },
      { dimension: UsersService.OUTPUT_MAX_DIMENSION, quality: 75 },
      { dimension: 512, quality: 75 },
      { dimension: 512, quality: 68 },
    ];

    for (const variant of variants) {
      const output = await sharp(input, {
        limitInputPixels: UsersService.MAX_INPUT_PIXELS,
        animated: false,
      })
        .rotate()
        .resize(variant.dimension, variant.dimension, {
          fit: 'cover',
          withoutEnlargement: true,
        })
        .webp({ quality: variant.quality })
        .toBuffer();

      if (output.length <= UsersService.MAX_OUTPUT_FILE_SIZE) {
        return output;
      }
    }

    throw new BadRequestException(
      'No fue posible optimizar la foto por debajo de 300 KB',
    );
  }

  private isPostgresUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    );
  }

  private async cleanupPreviousPhoto(
    previousPhoto: string | null,
    currentPhoto: string | null,
  ): Promise<void> {
    if (!previousPhoto || previousPhoto === currentPhoto) {
      return;
    }

    if (!this.isManagedStoragePath(previousPhoto)) {
      return;
    }

    await this.removeStorageObject(previousPhoto);
  }

  private async removeStorageObject(photoPath: string): Promise<void> {
    const { error } = await this.supabaseAdmin.storage
      .from(this.getProfileBucket())
      .remove([photoPath]);

    if (error) {
      this.logger.warn(
        `No se pudo borrar una foto de Storage (${photoPath}): ${error.message}`,
      );
    }
  }

  private getProfileBucket(): string {
    const bucket = this.configService.get<string>('SUPABASE_PROFILE_BUCKET');

    if (!bucket) {
      throw new Error('Falta la variable de entorno SUPABASE_PROFILE_BUCKET');
    }

    return bucket;
  }

  private isManagedStoragePath(photo: string): boolean {
    const value = photo.trim();

    if (!value) {
      return false;
    }

    return (
      !/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(value) && !value.startsWith('data:')
    );
  }

  private async toUserMeResponse(user: User): Promise<UserMeResponse> {
    return {
      id: user.id,
      nombre: user.nombre ?? null,
      telefono: user.telefono ?? null,
      correo: user.correo,
      estado: user.estado,
      tipoDocumento: user.tipoDocumento ?? null,
      numeroDocumento: user.numeroDocumento ?? null,
      foto: await this.resolveFotoUrl(user.foto ?? null),
    };
  }

  private async toUpdateUserProfileResponse(
    user: User,
  ): Promise<UpdateUserProfileResponse> {
    return {
      id: user.id,
      nombre: user.nombre ?? null,
      telefono: user.telefono ?? null,
      correo: user.correo,
      estado: user.estado,
      tipoDocumento: user.tipoDocumento ?? null,
      numeroDocumento: user.numeroDocumento ?? null,
      foto: await this.resolveFotoUrl(user.foto ?? null),
    };
  }

  async resolveFotoUrl(foto: string | null): Promise<string | null> {
    if (!foto) {
      return null;
    }

    if (!this.isManagedStoragePath(foto)) {
      return foto;
    }

    const { data, error } = await this.supabaseAdmin.storage
      .from(this.getProfileBucket())
      .createSignedUrl(foto, 60 * 60);

    if (error) {
      this.logger.warn(
        `No se pudo generar signed URL para (${foto}): ${error.message}`,
      );
      return null;
    }

    return data.signedUrl ?? null;
  }
}
