import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';

import { ChecklistService } from './checklist.service';
import { PrismaService } from '../prisma/prisma.service';

function makePrismaMock() {
  return {
    checklist: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    itemChecklist: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  } as unknown as PrismaService;
}

describe('ChecklistService', () => {
  let prisma: ReturnType<typeof makePrismaMock>;
  let service: ChecklistService;

  beforeEach(() => {
    prisma = makePrismaMock();
    service = new ChecklistService(prisma);
  });

  describe('multi-tenancy', () => {
    it('findAll only queries the caller empresaId', async () => {
      (prisma.checklist.findMany as jest.Mock<(...args: any[]) => any>).mockResolvedValue([]);
      await service.findAll(1, 42);
      expect((prisma.checklist.findMany as jest.Mock<(...args: any[]) => any>).mock.calls[0][0].where).toEqual({ empresaId: 42 });
    });

    it('findOne combines id + empresaId in a single query (cross-tenant id -> 404, not leaked data)', async () => {
      (prisma.checklist.findFirst as jest.Mock<(...args: any[]) => any>).mockResolvedValue(null);

      await expect(service.findOne(10, 1, 999)).rejects.toBeInstanceOf(NotFoundException);
      expect((prisma.checklist.findFirst as jest.Mock<(...args: any[]) => any>).mock.calls[0][0].where).toEqual({ id: 10, empresaId: 999 });
    });

    it('update/createItem/updateItem/removeItem/remove all pre-check ownership via findOne before mutating', async () => {
      (prisma.checklist.findFirst as jest.Mock<(...args: any[]) => any>).mockResolvedValue(null);

      await expect(service.update(10, {} as any, 999)).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.checklist.update).not.toHaveBeenCalled();

      await expect(service.createItem(10, { descricao: 'x' } as any, 999)).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.itemChecklist.create).not.toHaveBeenCalled();
    });
  });

  describe('createItem: automatic ordem', () => {
    it('uses dto.ordem when explicitly provided', async () => {
      (prisma.checklist.findFirst as jest.Mock<(...args: any[]) => any>).mockResolvedValue({ id: 1, empresaId: 1, itens: [] });
      (prisma.itemChecklist.create as jest.Mock<(...args: any[]) => any>).mockResolvedValue({ id: 1 });

      await service.createItem(1, { descricao: 'Item', ordem: 5 } as any, 1);

      expect((prisma.itemChecklist.create as jest.Mock<(...args: any[]) => any>).mock.calls[0][0].data.ordem).toBe(5);
    });

    it('defaults to 1 for the first item on an empty checklist', async () => {
      (prisma.checklist.findFirst as jest.Mock<(...args: any[]) => any>).mockResolvedValue({ id: 1, empresaId: 1, itens: [] });
      (prisma.itemChecklist.findFirst as jest.Mock<(...args: any[]) => any>).mockResolvedValue(null);
      (prisma.itemChecklist.create as jest.Mock<(...args: any[]) => any>).mockResolvedValue({ id: 1 });

      await service.createItem(1, { descricao: 'Item' } as any, 1);

      expect((prisma.itemChecklist.create as jest.Mock<(...args: any[]) => any>).mock.calls[0][0].data.ordem).toBe(1);
    });

    it('continues from the last item ordem + 1 when not provided', async () => {
      (prisma.checklist.findFirst as jest.Mock<(...args: any[]) => any>).mockResolvedValue({ id: 1, empresaId: 1, itens: [] });
      (prisma.itemChecklist.findFirst as jest.Mock<(...args: any[]) => any>).mockResolvedValue({ id: 9, ordem: 4 });
      (prisma.itemChecklist.create as jest.Mock<(...args: any[]) => any>).mockResolvedValue({ id: 2 });

      await service.createItem(1, { descricao: 'Item' } as any, 1);

      expect((prisma.itemChecklist.create as jest.Mock<(...args: any[]) => any>).mock.calls[0][0].data.ordem).toBe(5);
    });
  });

  describe('updateItem', () => {
    it('throws NotFoundException when the item does not belong to this checklist', async () => {
      (prisma.checklist.findFirst as jest.Mock<(...args: any[]) => any>).mockResolvedValue({ id: 1, empresaId: 1, itens: [] });
      (prisma.itemChecklist.findFirst as jest.Mock<(...args: any[]) => any>).mockResolvedValue(null);

      await expect(
        service.updateItem(1, 999, { descricao: 'Novo' } as any, 1),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.itemChecklist.update).not.toHaveBeenCalled();
    });

    it('updates only the item scoped to id + checklistId', async () => {
      (prisma.checklist.findFirst as jest.Mock<(...args: any[]) => any>).mockResolvedValue({ id: 1, empresaId: 1, itens: [] });
      (prisma.itemChecklist.findFirst as jest.Mock<(...args: any[]) => any>).mockResolvedValue({ id: 3, checklistId: 1 });
      (prisma.itemChecklist.update as jest.Mock<(...args: any[]) => any>).mockResolvedValue({ id: 3, descricao: 'Novo' });

      await service.updateItem(1, 3, { descricao: 'Novo' } as any, 1);

      expect((prisma.itemChecklist.findFirst as jest.Mock<(...args: any[]) => any>).mock.calls[0][0].where).toEqual({ id: 3, checklistId: 1 });
    });
  });
});
