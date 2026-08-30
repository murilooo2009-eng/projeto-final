import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { RolesGuard } from './roles.guard';

function makeContext(user: any): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let reflector: { getAllAndOverride: jest.Mock<(...args: any[]) => any> };
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  it('allows the request through when no @Roles() metadata is present (public/any-authenticated route)', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    expect(guard.canActivate(makeContext({ perfil: 'COLABORADOR' }))).toBe(true);
  });

  it('allows the request through for an empty roles array', () => {
    reflector.getAllAndOverride.mockReturnValue([]);
    expect(guard.canActivate(makeContext({ perfil: 'COLABORADOR' }))).toBe(true);
  });

  it('throws ForbiddenException when there is no authenticated user on the request', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    expect(() => guard.canActivate(makeContext(undefined))).toThrow(ForbiddenException);
  });

  it("throws ForbiddenException when the user's perfil is not in the allowed list", () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    expect(() => guard.canActivate(makeContext({ perfil: 'COLABORADOR' }))).toThrow(ForbiddenException);
  });

  it("allows the request when the user's perfil is in the allowed list", () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    expect(guard.canActivate(makeContext({ perfil: 'ADMIN' }))).toBe(true);
  });

  it('is a strict allow-list: a role not explicitly listed is rejected even if it seems more privileged', () => {
    reflector.getAllAndOverride.mockReturnValue(['COLABORADOR']);
    expect(() => guard.canActivate(makeContext({ perfil: 'ADMIN' }))).toThrow(ForbiddenException);
  });
});
