import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { SUPABASE_CLIENT } from '../../modules/supabase/supabase.module';
import type { SupabaseClient } from '@supabase/supabase-js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { AuthenticatedUser } from '../types/authenticated-user';

type RequestWithUser = Request & { user?: AuthenticatedUser };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(SUPABASE_CLIENT)
    private readonly supabase: SupabaseClient,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Falta el token Bearer de Supabase');
    }

    const accessToken = authHeader.slice(7).trim();

    if (!accessToken) {
      throw new UnauthorizedException('Falta el token Bearer de Supabase');
    }

    const { data, error } = await this.supabase.auth.getUser(accessToken);

    if (error || !data.user) {
      throw new UnauthorizedException('JWT inválido o expirado');
    }

    request.user = {
      id: data.user.id,
      email: data.user.email ?? null,
      role: data.user.role ?? null,
      aud: data.user.aud ?? null,
      appMetadata: data.user.app_metadata,
      userMetadata: data.user.user_metadata,
      accessToken,
    };

    return true;
  }
}
