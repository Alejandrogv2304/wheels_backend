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

  private getSupabaseErrorMessage(error: unknown, fallback: string): string {
    if (!error) {
      return fallback;
    }

    if (typeof error === 'string') {
      return error;
    }

    if (error instanceof Error) {
      return error.message || fallback;
    }

    if (typeof error === 'object') {
      const typedError = error as Record<string, unknown>;

      if (typeof typedError.message === 'string' && typedError.message.trim()) {
        return typedError.message;
      }

      try {
        const serialized = JSON.stringify(typedError);
        return serialized && serialized !== '{}' ? serialized : fallback;
      } catch {
        return fallback;
      }
    }

    return fallback;
  }

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
      const message = this.getSupabaseErrorMessage(
        error,
        'No se pudo registrar el usuario',
      );
      this.logger.warn(`register failed: ${message}`);
      throw new BadRequestException(message);
    }

    if (!data.user) {
      throw new BadRequestException('No se pudo crear el usuario en Supabase');
    }

    const profile = await this.usersService.upsertFromSupabaseUser(data.user);

    return {
      message: 'Usuario registrado correctamente',
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
      const message = this.getSupabaseErrorMessage(
        error,
        'No se pudo iniciar sesión',
      );
      this.logger.warn(`login failed: ${message}`);
      throw new UnauthorizedException(message);
    }

    if (!data.user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const profile = await this.usersService.upsertFromSupabaseUser(data.user);

    return {
      message: 'Login exitoso',
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
      const message = this.getSupabaseErrorMessage(
        error,
        'No se pudo generar la URL de autenticación con Google',
      );
      this.logger.warn(`google auth failed: ${message}`);
      throw new BadRequestException(message);
    }

    if (!data.url) {
      throw new BadRequestException(
        'No se pudo generar la URL de autenticación con Google',
      );
    }

    return {
      message: 'URL de Google Auth generada correctamente',
      url: data.url,
    };
  }
}
