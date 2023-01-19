import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User } from '../entities/user.entity';
import { AppError } from '../../commons/errors/app-error';
import { ERR_ONLY_ADMIN } from '../../commons/errors/errors-codes';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!roles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user: User = request.user;
    return this.matchRoles(roles, user.roles);
  }
  matchRoles(roles: string[], userRoles: string[]): boolean {
    if (!userRoles) {
      throw new ForbiddenException(
        new AppError(ERR_ONLY_ADMIN, 'ERR_NO_ACCESS_TO_THIS_PLACE'),
      );
    }
    return roles.some((role) => userRoles.includes(role));
  }
}
