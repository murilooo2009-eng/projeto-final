import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';

import {
  ExtractJwt,
  Strategy,
} from 'passport-jwt';

import { Perfil } from '@prisma/client';

import { AuthenticatedUser } from './interfaces/authenticated-user.interface';

interface JwtPayload {
  sub: number;
  empresaId: number;
  perfil: Perfil;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
  ) {
    const secret =
      config.get<string>('JWT_SECRET');

    if (!secret) {
      throw new Error(
        'JWT_SECRET não configurado',
      );
    }

    super({
      jwtFromRequest:
        ExtractJwt.fromAuthHeaderAsBearerToken(),

      secretOrKey: secret,
    });
  }

  async validate(
    payload: JwtPayload,
  ): Promise<AuthenticatedUser> {
    if (
      !payload.sub ||
      !payload.empresaId ||
      !payload.perfil
    ) {
      throw new UnauthorizedException(
        'Token inválido',
      );
    }

    return {
      id: payload.sub,
      empresaId: payload.empresaId,
      perfil: payload.perfil,
    };
  }
}