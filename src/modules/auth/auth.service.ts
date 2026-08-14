import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { SUPABASE_CLIENT } from '../supabase/supabase.module';
import type { SupabaseClient } from '@supabase/supabase-js';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(SUPABASE_CLIENT)
    private readonly supabase: SupabaseClient,
    private readonly usersService: UsersService,
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

    return {
      message: 'Inicio de sesión exitoso',
      profile,
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
}
