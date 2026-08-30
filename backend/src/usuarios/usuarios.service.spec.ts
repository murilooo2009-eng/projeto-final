import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { ConflictException, NotFoundException } from '@nestjs/common';

import { UsuariosService } from './usuarios.service';
import { PrismaService } from '../prisma/prisma.service';

function makePrismaMock() {
  return {
    usuario: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  } as unknown as PrismaService;
}

describe('UsuariosService', () => {
  let prisma: ReturnType<typeof makePrismaMock>;
  let service: UsuariosService;

  beforeEach(() => {
    prisma = makePrismaMock();
    service = new UsuariosService(prisma);
  });

  describe('create', () => {
    it('hashes the password and defaults perfil to COLABORADOR', async () => {
      (prisma.usuario.findUnique as jest.Mock<(...args: any[]) => any>).mockResolvedValue(null);
      (prisma.usuario.create as jest.Mock<(...args: any[]) => any>).mockImplementation(async ({ data }: any) => ({
        id: 1,
        ativo: true,
        ...data,
      }));

      const result = await service.create(
        { nome: 'Ana', email: 'ana@empresa.com', senha: 'senhaForte123' } as any,
        7,
      );

      expect(result.perfil).toBe('COLABORADOR');
      expect(result.empresaId).toBe(7);
      const createCall = (prisma.usuario.create as jest.Mock<(...args: any[]) => any>).mock.calls[0][0];
      expect(createCall.data.senhaHash).not.toBe('senhaForte123');
      expect(createCall.data.senhaHash.length).toBeGreaterThan(20);
      expect(JSON.stringify(result)).not.toMatch(/senhaForte123/);
    });

    it('rejects an email that already exists anywhere (email is globally unique, not per-empresa)', async () => {
      (prisma.usuario.findUnique as jest.Mock<(...args: any[]) => any>).mockResolvedValue({ id: 99, email: 'ana@empresa.com' });

      await expect(
        service.create({ nome: 'Ana', email: 'ana@empresa.com', senha: 'senhaForte123' } as any, 7),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects creation without a password', async () => {
      (prisma.usuario.findUnique as jest.Mock<(...args: any[]) => any>).mockResolvedValue(null);

      await expect(
        service.create({ nome: 'Ana', email: 'ana@empresa.com' } as any, 7),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('findOne (multi-tenancy)', () => {
    it('scopes the lookup by empresaId, so another company id returns NotFoundException', async () => {
      (prisma.usuario.findFirst as jest.Mock<(...args: any[]) => any>).mockResolvedValue(null);

      await expect(service.findOne(5, 999)).rejects.toBeInstanceOf(NotFoundException);
      expect((prisma.usuario.findFirst as jest.Mock<(...args: any[]) => any>).mock.calls[0][0].where).toMatchObject({
        id: 5,
        empresaId: 999,
      });
    });

    it('never selects the password hash', async () => {
      (prisma.usuario.findFirst as jest.Mock<(...args: any[]) => any>).mockResolvedValue({ id: 5, empresaId: 1 });
      await service.findOne(5, 1);
      const select = (prisma.usuario.findFirst as jest.Mock<(...args: any[]) => any>).mock.calls[0][0].select;
      expect(select.senhaHash).toBeUndefined();
    });
  });

  describe('update', () => {
    it('pre-checks the user belongs to the caller empresa before updating (cross-tenant -> 404)', async () => {
      (prisma.usuario.findFirst as jest.Mock<(...args: any[]) => any>).mockResolvedValue(null);

      await expect(
        service.update(5, { nome: 'Novo Nome' } as any, 999),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.usuario.update).not.toHaveBeenCalled();
    });

    it('converts a P2002 unique-constraint error into ConflictException', async () => {
      (prisma.usuario.findFirst as jest.Mock<(...args: any[]) => any>).mockResolvedValue({ id: 5, empresaId: 1 });
      (prisma.usuario.update as jest.Mock<(...args: any[]) => any>).mockRejectedValue(
        Object.assign(new Error('duplicate'), { code: 'P2002' }),
      );

      await expect(
        service.update(5, { email: 'outro@empresa.com' } as any, 1),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('only includes provided fields in the update payload (partial update)', async () => {
      (prisma.usuario.findFirst as jest.Mock<(...args: any[]) => any>).mockResolvedValue({ id: 5, empresaId: 1 });
      (prisma.usuario.update as jest.Mock<(...args: any[]) => any>).mockResolvedValue({ id: 5, empresaId: 1, nome: 'Novo Nome' });

      await service.update(5, { nome: 'Novo Nome' } as any, 1);

      const data = (prisma.usuario.update as jest.Mock<(...args: any[]) => any>).mock.calls[0][0].data;
      expect(data).toEqual({ nome: 'Novo Nome' });
    });
  });

  describe('updateStatus / remove', () => {
    it('updateStatus flips ativo and is scoped to the caller empresa', async () => {
      (prisma.usuario.findFirst as jest.Mock<(...args: any[]) => any>).mockResolvedValue({ id: 5, empresaId: 1 });
      (prisma.usuario.update as jest.Mock<(...args: any[]) => any>).mockResolvedValue({ id: 5, ativo: false });

      await service.updateStatus(5, false, 1);

      expect((prisma.usuario.update as jest.Mock<(...args: any[]) => any>).mock.calls[0][0].data).toEqual({ ativo: false });
    });

    it('remove() is a soft delete: it deactivates the user instead of deleting the row', async () => {
      (prisma.usuario.findFirst as jest.Mock<(...args: any[]) => any>).mockResolvedValue({ id: 5, empresaId: 1 });
      (prisma.usuario.update as jest.Mock<(...args: any[]) => any>).mockResolvedValue({ id: 5, ativo: false });

      await service.remove(5, 1);

      expect((prisma.usuario.update as jest.Mock<(...args: any[]) => any>).mock.calls[0][0].data).toEqual({ ativo: false });
    });

    it('cannot change status of a user from another empresa (404)', async () => {
      (prisma.usuario.findFirst as jest.Mock<(...args: any[]) => any>).mockResolvedValue(null);

      await expect(service.updateStatus(5, false, 999)).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.usuario.update).not.toHaveBeenCalled();
    });
  });
});
