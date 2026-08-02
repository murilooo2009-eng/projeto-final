import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Role } from '@prisma/client';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';

interface JwtPayload {
  sub: number;
  empresaId: number;
  role: Role;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload,): Promise<AuthenticatedUser> {
    return {
      id: payload.sub,
      empresaId: payload.empresaId,
      role: payload.role
    };
  }
}