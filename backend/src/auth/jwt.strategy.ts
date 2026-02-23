import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
constructor(private config: ConfigService) {
  super({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: config.get<string>('JWT_SECRET'),
  });
}

  async validate(payload: any) {
    return {
      id: payload.sub,
      empresaId: payload.empresaId
    };
  }
}