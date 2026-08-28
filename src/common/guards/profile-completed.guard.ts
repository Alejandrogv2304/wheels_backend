import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { UsersService } from '../../modules/users/users.service';
import type { AuthenticatedUser } from '../types/authenticated-user';

type RequestWithUser = Request & { user?: AuthenticatedUser };

@Injectable()
export class ProfileCompletedGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const userId = request.user?.id;

    if (!userId) {
      throw new ForbiddenException('No se pudo identificar al usuario');
    }

    if (!(await this.usersService.isProfileComplete(userId))) {
      throw new ForbiddenException(
        'Debes completar tu perfil antes de realizar esta acción',
      );
    }

    return true;
  }
}
