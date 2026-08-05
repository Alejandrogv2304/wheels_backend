import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SUPABASE_CLIENT } from '../supabase/supabase.module';
import type { SupabaseClient } from '@supabase/supabase-js';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
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
        },
      },
    });

    if (error) {
      throw new BadRequestException(error.message);
    }

    if (!data.user) {
      throw new BadRequestException('No se pudo crear el usuario en Supabase');
    }

    const profile = await this.usersService.upsertFromSupabaseUser(data.user);

    return {
      message: 'Usuario registrado correctamente',
      requiresEmailConfirmation: !data.session,
      user: data.user,
      session: data.session,
      profile,
    };
  }

  async login(dto: LoginDto) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    if (!data.user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const profile = await this.usersService.upsertFromSupabaseUser(data.user);

    return {
      message: 'Login exitoso',
      user: data.user,
      session: data.session,
      profile,
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
      throw new BadRequestException(error.message);
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
