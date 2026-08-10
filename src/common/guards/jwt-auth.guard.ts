import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import {
  createRemoteJWKSet,
  jwtVerify,
  type JWTPayload,
  type JWTVerifyResult,
} from 'jose';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { AuthenticatedUser } from '../types/authenticated-user';

type RequestWithUser = Request & { user?: AuthenticatedUser };

type SupabaseJwtPayload = JWTPayload & {
  email?: string | null;
  role?: string | null;
  app_metadata?: AuthenticatedUser['appMetadata'];
  user_metadata?: AuthenticatedUser['userMetadata'];
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly jwks;

  private readonly issuer: string;

  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');

    if (!supabaseUrl) {
      throw new Error('Falta la variable de entorno SUPABASE_URL');
    }

    this.issuer = `${supabaseUrl.replace(/\/$/, '')}/auth/v1`;
    this.jwks = createRemoteJWKSet(
      new URL(`${this.issuer}/.well-known/jwks.json`),
    );
  }

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

    const verifiedToken = await this.verifyToken(accessToken);

    request.user = this.mapPayloadToAuthenticatedUser(
      accessToken,
      verifiedToken.payload as SupabaseJwtPayload,
    );

    return true;
  }

  private async verifyToken(
    accessToken: string,
  ): Promise<JWTVerifyResult<SupabaseJwtPayload>> {
    try {
      return await jwtVerify<SupabaseJwtPayload>(accessToken, this.jwks, {
        issuer: this.issuer,
      });
    } catch {
      throw new UnauthorizedException('JWT inválido o expirado');
    }
  }

  private mapPayloadToAuthenticatedUser(
    accessToken: string,
    payload: SupabaseJwtPayload,
  ): AuthenticatedUser {
    if (!payload.sub) {
      throw new UnauthorizedException('JWT inválido o expirado');
    }

    return {
      id: payload.sub,
      email: payload.email ?? null,
      role: payload.role ?? null,
      aud: payload.aud ? String(payload.aud) : null,
      appMetadata: payload.app_metadata ?? {},
      userMetadata: payload.user_metadata ?? {},
      accessToken,
    };
  }
}
