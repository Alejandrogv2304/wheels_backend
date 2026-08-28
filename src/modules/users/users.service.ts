import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { User } from './entities/User.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
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
      foto: foto ?? existingUser?.foto ?? undefined,
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

  async isProfileComplete(userId: string): Promise<boolean> {
    const user = await this.findById(userId);

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

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Solo aplicamos campos realmente enviados para no alterar los omitidos.
    const updates = Object.fromEntries(
      Object.entries(dto).filter(([, value]) => value !== undefined),
    );
    Object.assign(user, updates);

    try {
      await this.usersRepository.save(user);

      const updatedUser = await this.findById(userId);

      if (!updatedUser) {
        throw new NotFoundException('Usuario no encontrado');
      }

      return updatedUser;
    } catch (error) {
      if (this.isPostgresUniqueViolation(error)) {
        throw new ConflictException(
          'El telefono o numero de documento ya está registrado',
        );
      }

      throw error;
    }
  }

  private isPostgresUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    );
  }
}
