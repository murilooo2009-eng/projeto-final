import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

function makePrismaMock() {
  return {
    usuario: {
      findUnique: jest.fn<(...args: any[]) => any>(),
    },
    $transaction: jest.fn<(...args: any[]) => any>(),
  } as unknown as PrismaService;
}

function asyncMock(value: unknown) {
  return jest.fn<(...args: any[]) => any>().mockResolvedValue(value);
}

describe('AuthService', () => {
  let prisma: ReturnType<typeof makePrismaMock>;
  let jwtService: { signAsync: jest.Mock<(...args: any[]) => any> };
  let service: AuthService;

  beforeEach(() => {
    prisma = makePrismaMock();
    jwtService = { signAsync: jest.fn<(...args: any[]) => any>().mockResolvedValue('signed.jwt.token') };
    service = new AuthService(prisma, jwtService as unknown as JwtService);
  });

  describe('register', () => {
    it('creates empresa + admin user inside a transaction and never returns a password field', async () => {
      (prisma.$transaction as jest.Mock<(...args: any[]) => any>).mockImplementation(async (fn: any) =>
        fn({
          empresa: { create: asyncMock({ id: 1, nome: 'Empresa X' }) },
          usuario: {
            create: asyncMock({
              id: 10,
              nome: 'Ana',
              email: 'ana@empresa.com',
              perfil: 'ADMIN',
              ativo: true,
              empresaId: 1,
            }),
          },
        }),
      );

      const result = await service.register({
        nome: 'Ana',
        email: 'ana@empresa.com',
        senha: 'senhaForte123',
        nomeEmpresa: 'Empresa X',
      });

      expect(result.empresa).toEqual({ id: 1, nome: 'Empresa X' });
      expect(result.usuario).toMatchObject({ id: 10, email: 'ana@empresa.com', perfil: 'ADMIN' });
      expect(JSON.stringify(result)).not.toMatch(/senha/i);
    });

    it('rejects duplicate email with BadRequestException (not a raw DB error)', async () => {
      (prisma.$transaction as jest.Mock<(...args: any[]) => any>).mockImplementation(async (fn: any) =>
        fn({
          empresa: { create: asyncMock({ id: 1, nome: 'Empresa X' }) },
          usuario: {
            create: jest.fn<(...args: any[]) => any>().mockRejectedValue(
              Object.assign(new Error('Unique constraint failed'), { code: 'P2002' }),
            ),
          },
        }),
      );

      await expect(
        service.register({
          nome: 'Ana',
          email: 'ana@empresa.com',
          senha: 'senhaForte123',
          nomeEmpresa: 'Empresa X',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('login', () => {
    it('returns an access_token for correct credentials on an active user', async () => {
      const senhaHash = await bcrypt.hash('senhaForte123', 4);
      (prisma.usuario.findUnique as jest.Mock<(...args: any[]) => any>).mockResolvedValue({
        id: 5,
        email: 'ana@empresa.com',
        senhaHash,
        perfil: 'ADMIN',
        ativo: true,
        empresaId: 1,
      });

      const result = await service.login({ email: 'ana@empresa.com', senha: 'senhaForte123' });

      expect(result.access_token).toBe('signed.jwt.token');
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({ sub: 5, empresaId: 1, perfil: 'ADMIN' }),
      );
    });

    it('rejects wrong password with UnauthorizedException', async () => {
      const senhaHash = await bcrypt.hash('senhaCorreta', 4);
      (prisma.usuario.findUnique as jest.Mock<(...args: any[]) => any>).mockResolvedValue({
        id: 5, email: 'ana@empresa.com', senhaHash, perfil: 'ADMIN', ativo: true, empresaId: 1,
      });

      await expect(
        service.login({ email: 'ana@empresa.com', senha: 'senhaErrada' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects a nonexistent email with the exact same error as a wrong password (no user enumeration)', async () => {
      (prisma.usuario.findUnique as jest.Mock<(...args: any[]) => any>).mockResolvedValue(null);

      let messageForMissingUser = '';
      try {
        await service.login({ email: 'ninguem@empresa.com', senha: 'qualquer' });
      } catch (e: any) {
        messageForMissingUser = e.message;
      }

      const senhaHash = await bcrypt.hash('senhaCorreta', 4);
      (prisma.usuario.findUnique as jest.Mock<(...args: any[]) => any>).mockResolvedValue({
        id: 5, email: 'ana@empresa.com', senhaHash, perfil: 'ADMIN', ativo: true, empresaId: 1,
      });

      let messageForWrongPassword = '';
      try {
        await service.login({ email: 'ana@empresa.com', senha: 'errada' });
      } catch (e: any) {
        messageForWrongPassword = e.message;
      }

      expect(messageForMissingUser).toBe(messageForWrongPassword);
      expect(messageForMissingUser.length).toBeGreaterThan(0);
    });

    it('rejects an inactive user even with the correct password', async () => {
      const senhaHash = await bcrypt.hash('senhaForte123', 4);
      (prisma.usuario.findUnique as jest.Mock<(...args: any[]) => any>).mockResolvedValue({
        id: 5, email: 'ana@empresa.com', senhaHash, perfil: 'ADMIN', ativo: false, empresaId: 1,
      });

      await expect(
        service.login({ email: 'ana@empresa.com', senha: 'senhaForte123' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
