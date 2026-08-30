import { describe, it, expect, jest } from '@jest/globals';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { JwtStrategy } from './jwt.strategy';

function makeStrategy(secret?: string) {
  const config = { get: jest.fn().mockReturnValue(secret) } as unknown as ConfigService;
  return new JwtStrategy(config);
}

describe('JwtStrategy', () => {
  it('throws at construction time if JWT_SECRET is not configured', () => {
    expect(() => makeStrategy(undefined)).toThrow('JWT_SECRET não configurado');
  });

  it('validate() maps the JWT payload (sub/empresaId/perfil) to the request user shape', async () => {
    const strategy = makeStrategy('test-secret');
    const user = await strategy.validate({ sub: 42, empresaId: 7, perfil: 'ADMIN' } as any);
    expect(user).toEqual({ id: 42, empresaId: 7, perfil: 'ADMIN' });
  });

  it('rejects a payload missing sub/empresaId/perfil', async () => {
    const strategy = makeStrategy('test-secret');
    await expect(strategy.validate({ empresaId: 7, perfil: 'ADMIN' } as any)).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(strategy.validate({ sub: 1, perfil: 'ADMIN' } as any)).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(strategy.validate({ sub: 1, empresaId: 7 } as any)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
