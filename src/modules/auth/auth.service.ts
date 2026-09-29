import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SUPABASE_ADMIN_CLIENT,
  SUPABASE_CLIENT,
} from '../supabase/supabase.module';
import type { SupabaseClient } from '@supabase/supabase-js';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RequestPasswordRecoveryDto } from './dto/request-password-recovery.dto';
import { ConfirmPasswordRecoveryDto } from './dto/confirm-password-recovery.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(SUPABASE_CLIENT)
    private readonly supabase: SupabaseClient,
    @Inject(SUPABASE_ADMIN_CLIENT)
    private readonly supabaseAdmin: SupabaseClient,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const { data, error } = await this.supabase.auth.signUp({
      email: dto.email,
      password: dto.password,
      options: {
        data: {
          name: dto.name,
          phone: dto.phone,
        },
      },
    });

    if (error) {
      this.logger.warn('Registro fallido');
      throw new BadRequestException('No se pudo completar el registro');
    }

    if (!data.user) {
      throw new BadRequestException('No se pudo completar el registro');
    }

    await this.usersService.upsertFromSupabaseUser(data.user);

    return {
      message: 'Revisa tu correo para confirmar tu cuenta',
      requiresEmailConfirmation: !data.session,
      userId: data.user.id,
      email: data.user.email,
    };
  }

  async login(dto: LoginDto) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (error) {
      const errorMessage =
        error instanceof Error ? error.message.toLowerCase() : '';

      if (
        errorMessage.includes('email not confirmed') ||
        errorMessage.includes('email is not confirmed') ||
        errorMessage.includes('not confirmed')
      ) {
        this.logger.warn(
          `Inicio de sesión bloqueado porque el correo no esta confirmado para ${dto.email}`,
        );
        throw new UnauthorizedException(
          'Debes confirmar tu correo antes de iniciar sesión',
        );
      }

      this.logger.warn('Inicio de sesión fallido');
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!data.user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const profile = await this.usersService.upsertFromSupabaseUser(data.user);
    const fotoUrl = await this.usersService.resolveFotoUrl(
      profile.foto ?? null,
    );

    return {
      message: 'Inicio de sesión exitoso',
      profile: {
        ...profile,
        foto: fotoUrl,
      },
      session: data.session
        ? {
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
            expiresAt: data.session.expires_at,
            tokenType: data.session.token_type,
            userId: data.user.id,
            email: data.user.email,
          }
        : null,
    };
  }

  async googleAuth(redirectTo?: string) {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    });

    if (error) {
      this.logger.warn('Autenticación con Google fallida');
      throw new BadRequestException(
        'No se pudo generar la URL de autenticación con Google',
      );
    }

    if (!data.url) {
      throw new BadRequestException(
        'No se pudo generar la URL de autenticación con Google',
      );
    }

    return {
      message: 'URL de autenticación con Google generada correctamente',
      url: data.url,
    };
  }

  async requestPasswordRecovery(dto: RequestPasswordRecoveryDto) {
    const redirectTo = this.configService.get<string>(
      'PASSWORD_RESET_REDIRECT_URL',
      `${this.configService.get<string>('APP_URL', '')}/reset-password`,
    );

    const { error } = await this.supabase.auth.resetPasswordForEmail(
      dto.email.trim().toLowerCase(),
      { redirectTo },
    );

    if (error) {
      this.logger.warn(`Solicitud de recuperación fallida: ${error.message}`);
      throw new BadRequestException(
        'No se pudo procesar la solicitud de recuperación',
      );
    }

    // La respuesta es deliberadamente genérica para no revelar si el correo
    // existe ni si pertenece a una cuenta de Google.
    return {
      message:
        'Si el correo está registrado, recibirás instrucciones para recuperar tu contraseña',
    };
  }

  async confirmPasswordRecovery(
    accessToken: string,
    dto: ConfirmPasswordRecoveryDto,
  ) {
    if (!accessToken) {
      throw new UnauthorizedException('Falta el token de recuperación ');
    }

    // El token proviene del enlace de recuperación enviado por Supabase.
    // getUser valida el token contra Auth y evita confiar únicamente en datos
    // enviados por el cliente, como el correo o el userId.
    const { data, error } = await this.supabase.auth.getUser(accessToken);

    if (error || !data.user) {
      throw new UnauthorizedException('El token de recuperación no es válido');
    }

    // Se rechaza cualquier cuenta que tenga Google vinculado, incluso si
    // también tiene una identidad email. Así se bloquean las cuentas mixtas.
    const tieneGoogle = (data.user.identities ?? []).some(
      (identity) => identity.provider === 'google',
    );

    if (tieneGoogle) {
      throw new ForbiddenException(
        'Las cuentas de Google deben administrar su contraseña desde Google',
      );
    }

    const tieneIdentidadEmail = (data.user.identities ?? []).some(
      (identity) => identity.provider === 'email',
    );

    if (!tieneIdentidadEmail) {
      throw new ForbiddenException(
        'Esta cuenta no puede recuperar la contraseña por este medio',
      );
    }

    // El access token ya fue validado arriba. Usamos el cliente admin para
    // actualizar la contraseña porque updateUser() requiere una sesión
    // completa (access_token + refresh_token), mientras este endpoint recibe
    // únicamente el access token en Authorization.
    const { error: updateError } =
      await this.supabaseAdmin.auth.admin.updateUserById(data.user.id, {
        password: dto.password,
      });

    if (updateError) {
      this.logger.warn(
        `Actualización de contraseña fallida para ${data.user.id}: ${updateError.message}`,
      );
      throw new BadRequestException('No se pudo actualizar la contraseña');
    }

    return {
      message: 'Contraseña actualizada correctamente',
    };
  }
}
