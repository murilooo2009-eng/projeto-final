import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';

import { Perfil } from '@prisma/client';

import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard
  implements CanActivate
{
  constructor(
    private readonly reflector: Reflector,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean {
    const roles =
      this.reflector.getAllAndOverride<
        Perfil[]
      >(
        ROLES_KEY,
        [
          context.getHandler(),
          context.getClass(),
        ],
      );

    if (
      !roles ||
      roles.length === 0
    ) {
      return true;
    }

    const request =
      context.switchToHttp().getRequest();

    const user = request.user;

    if (!user) {
      throw new ForbiddenException(
        'Usuário não autenticado',
      );
    }

    if (
      !roles.includes(user.perfil)
    ) {
      throw new ForbiddenException(
        'Você não possui permissão para esta operação',
      );
    }

    return true;
  }
}