import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import { ExecucaoService, UsuarioExecucao } from './execucao.service';
import { PrismaService } from '../prisma/prisma.service';

function makePrismaMock() {
  const asyncFn = () => jest.fn<(...args: any[]) => any>();
  const tx = {
    execucaoChecklist: { create: asyncFn(), findFirst: asyncFn() },
    execucaoItem: { createMany: asyncFn(), findFirst: asyncFn(), update: asyncFn() },
  };
  return {
    checklist: { findFirst: asyncFn() },
    execucaoChecklist: {
      findFirst: asyncFn(),
      findMany: asyncFn(),
      count: asyncFn(),
      update: asyncFn(),
    },
    execucaoItem: {
      findFirst: asyncFn(),
      update: asyncFn(),
    },
    $transaction: jest.fn<(...args: any[]) => any>().mockImplementation(async (arg: any) => (Array.isArray(arg) ? Promise.all(arg) : arg(tx))),
    __tx: tx,
  } as unknown as PrismaService & { __tx: typeof tx };
}

const admin: UsuarioExecucao = { id: 1, empresaId: 1, perfil: 'ADMIN' };
const colaborador: UsuarioExecucao = { id: 2, empresaId: 1, perfil: 'COLABORADOR' };
const colaboradorOutraEmpresa: UsuarioExecucao = { id: 3, empresaId: 2, perfil: 'COLABORADOR' };

describe('ExecucaoService', () => {
  let prisma: ReturnType<typeof makePrismaMock>;
  let service: ExecucaoService;

  beforeEach(() => {
    prisma = makePrismaMock();
    service = new ExecucaoService(prisma);
  });

  describe('criar (section 4.1)', () => {
    it('throws NotFoundException when checklist does not exist, is inactive, or belongs to another empresa (single combined check)', async () => {
      (prisma.checklist.findFirst as jest.Mock<(...args: any[]) => any>).mockResolvedValue(null);

      await expect(service.criar(colaborador, { checklistId: 99 })).rejects.toBeInstanceOf(NotFoundException);
      expect((prisma.checklist.findFirst as jest.Mock<(...args: any[]) => any>).mock.calls[0][0].where).toEqual({
        id: 99,
        empresaId: 1,
        ativo: true,
      });
    });

    it('throws BadRequestException when the checklist has no items', async () => {
      (prisma.checklist.findFirst as jest.Mock<(...args: any[]) => any>).mockResolvedValue({ id: 1, empresaId: 1, itens: [] });

      await expect(service.criar(colaborador, { checklistId: 1 })).rejects.toBeInstanceOf(BadRequestException);
    });

    it('reuses an existing EM_ANDAMENTO execution instead of creating a duplicate', async () => {
      (prisma.checklist.findFirst as jest.Mock<(...args: any[]) => any>).mockResolvedValue({
        id: 1, empresaId: 1, itens: [{ id: 10 }],
      });
      (prisma.execucaoChecklist.findFirst as jest.Mock<(...args: any[]) => any>)
        .mockResolvedValueOnce({ id: 55 }) // the "already in progress" lookup
        .mockResolvedValueOnce({ id: 55, empresaId: 1, itens: [] }); // buscarPorId's own lookup

      const result = await service.criar(colaborador, { checklistId: 1 });

      expect(result.id).toBe(55);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('creates the execution and copies every checklist item as not concluded', async () => {
      (prisma.checklist.findFirst as jest.Mock<(...args: any[]) => any>).mockResolvedValue({
        id: 1, empresaId: 1, itens: [{ id: 10 }, { id: 11 }],
      });
      (prisma.execucaoChecklist.findFirst as jest.Mock<(...args: any[]) => any>)
        .mockResolvedValueOnce(null) // no existing EM_ANDAMENTO
        .mockResolvedValueOnce({ id: 77, empresaId: 1, itens: [] }); // final buscarPorId

      prisma.__tx.execucaoChecklist.create.mockResolvedValue({ id: 77 });
      prisma.__tx.execucaoItem.createMany.mockResolvedValue({ count: 2 });

      await service.criar(colaborador, { checklistId: 1 });

      const createArgs = prisma.__tx.execucaoChecklist.create.mock.calls[0][0];
      expect(createArgs.data).toMatchObject({
        checklistId: 1, usuarioId: 2, empresaId: 1, status: 'EM_ANDAMENTO',
      });
      expect(createArgs.data.iniciadaEm).toBeInstanceOf(Date);

      const itemsArgs = prisma.__tx.execucaoItem.createMany.mock.calls[0][0];
      expect(itemsArgs.data).toEqual([
        { execucaoId: 77, itemChecklistId: 10, concluido: false },
        { execucaoId: 77, itemChecklistId: 11, concluido: false },
      ]);
    });
  });

  describe('buscarPorId / listar / listarEmAndamento (multi-tenancy, section 4.2/4.3/4.8)', () => {
    it('COLABORADOR queries always add usuarioId to the where clause; ADMIN does not', async () => {
      (prisma.execucaoChecklist.findFirst as jest.Mock<(...args: any[]) => any>).mockResolvedValue(null);

      await expect(service.buscarPorId(colaborador, 1)).rejects.toBeInstanceOf(NotFoundException);
      expect((prisma.execucaoChecklist.findFirst as jest.Mock<(...args: any[]) => any>).mock.calls[0][0].where).toMatchObject({
        id: 1, empresaId: 1, usuarioId: 2,
      });

      (prisma.execucaoChecklist.findFirst as jest.Mock<(...args: any[]) => any>).mockClear().mockResolvedValue(null);
      await expect(service.buscarPorId(admin, 1)).rejects.toBeInstanceOf(NotFoundException);
      expect((prisma.execucaoChecklist.findFirst as jest.Mock<(...args: any[]) => any>).mock.calls[0][0].where).not.toHaveProperty('usuarioId');
    });

    it('listar ignores a client-supplied usuarioId filter for COLABORADOR (cannot see others via query param)', async () => {
      (prisma.execucaoChecklist.findMany as jest.Mock<(...args: any[]) => any>).mockResolvedValue([]);
      (prisma.execucaoChecklist.count as jest.Mock<(...args: any[]) => any>).mockResolvedValue(0);
      (prisma.$transaction as jest.Mock<(...args: any[]) => any>).mockImplementation(async (arg: any) => Promise.all(arg));

      await service.listar(colaborador, { usuarioId: 999 } as any);

      const where = (prisma.execucaoChecklist.findMany as jest.Mock<(...args: any[]) => any>).mock.calls[0][0].where;
      expect(where.usuarioId).toBe(2); // the caller's own id, not the requested 999
    });

    it('listar: ADMIN-supplied usuarioId filter IS honored', async () => {
      (prisma.execucaoChecklist.findMany as jest.Mock<(...args: any[]) => any>).mockResolvedValue([]);
      (prisma.execucaoChecklist.count as jest.Mock<(...args: any[]) => any>).mockResolvedValue(0);
      (prisma.$transaction as jest.Mock<(...args: any[]) => any>).mockImplementation(async (arg: any) => Promise.all(arg));

      await service.listar(admin, { usuarioId: 42 } as any);

      expect((prisma.execucaoChecklist.findMany as jest.Mock<(...args: any[]) => any>).mock.calls[0][0].where).toMatchObject({ usuarioId: 42 });
    });

    it('listarEmAndamento filters by status EM_ANDAMENTO and scopes COLABORADOR to their own', async () => {
      (prisma.execucaoChecklist.findMany as jest.Mock<(...args: any[]) => any>).mockResolvedValue([]);

      await service.listarEmAndamento(colaborador);

      expect((prisma.execucaoChecklist.findMany as jest.Mock<(...args: any[]) => any>).mock.calls[0][0].where).toMatchObject({
        empresaId: 1, usuarioId: 2, status: 'EM_ANDAMENTO',
      });
    });
  });

  describe('atualizarItem (section 4.4)', () => {
    const execucaoEmAndamento = { id: 1, empresaId: 1, usuarioId: 2, checklistId: 5, status: 'EM_ANDAMENTO' };

    it('throws NotFoundException for a cross-tenant / cross-user execution id', async () => {
      (prisma.execucaoChecklist.findFirst as jest.Mock<(...args: any[]) => any>).mockResolvedValue(null);

      await expect(
        service.atualizarItem(colaboradorOutraEmpresa, 1, 10, { concluido: true }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws ConflictException when the execution is not EM_ANDAMENTO', async () => {
      (prisma.execucaoChecklist.findFirst as jest.Mock<(...args: any[]) => any>).mockResolvedValue({ ...execucaoEmAndamento, status: 'CONCLUIDA' });

      await expect(
        service.atualizarItem(colaborador, 1, 10, { concluido: true }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('throws NotFoundException when the item does not belong to this execution', async () => {
      (prisma.execucaoChecklist.findFirst as jest.Mock<(...args: any[]) => any>).mockResolvedValue(execucaoEmAndamento);
      (prisma.execucaoItem.findFirst as jest.Mock<(...args: any[]) => any>).mockResolvedValue(null);

      await expect(
        service.atualizarItem(colaborador, 1, 999, { concluido: true }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws BadRequestException when the item belongs to a different checklist than the execution', async () => {
      (prisma.execucaoChecklist.findFirst as jest.Mock<(...args: any[]) => any>).mockResolvedValue(execucaoEmAndamento);
      (prisma.execucaoItem.findFirst as jest.Mock<(...args: any[]) => any>).mockResolvedValue({
        id: 10, itemChecklist: { checklistId: 999 },
      });

      await expect(
        service.atualizarItem(colaborador, 1, 10, { concluido: true }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('sets concluidoEm when marking concluded, clears it when unmarking', async () => {
      (prisma.execucaoChecklist.findFirst as jest.Mock<(...args: any[]) => any>).mockResolvedValue(execucaoEmAndamento);
      (prisma.execucaoItem.findFirst as jest.Mock<(...args: any[]) => any>).mockResolvedValue({
        id: 10, itemChecklist: { checklistId: 5 },
      });
      (prisma.execucaoItem.update as jest.Mock<(...args: any[]) => any>).mockResolvedValue({});

      await service.atualizarItem(colaborador, 1, 10, { concluido: true });
      expect((prisma.execucaoItem.update as jest.Mock<(...args: any[]) => any>).mock.calls[0][0].data.concluidoEm).toBeInstanceOf(Date);

      await service.atualizarItem(colaborador, 1, 10, { concluido: false });
      expect((prisma.execucaoItem.update as jest.Mock<(...args: any[]) => any>).mock.calls[1][0].data.concluidoEm).toBeNull();
    });
  });

  describe('finalizar (section 4.6)', () => {
    it('throws BadRequestException when required items are still pending', async () => {
      (prisma.execucaoChecklist.findFirst as jest.Mock<(...args: any[]) => any>).mockResolvedValue({
        id: 1, empresaId: 1, status: 'EM_ANDAMENTO',
        itens: [
          { concluido: false, itemChecklist: { obrigatorio: true } },
          { concluido: true, itemChecklist: { obrigatorio: false } },
        ],
      });

      await expect(service.finalizar(colaborador, 1)).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.execucaoChecklist.update).not.toHaveBeenCalled();
    });

    it('succeeds when required items are done, even if an optional item is pending', async () => {
      (prisma.execucaoChecklist.findFirst as jest.Mock<(...args: any[]) => any>).mockResolvedValue({
        id: 1, empresaId: 1, status: 'EM_ANDAMENTO',
        itens: [
          { concluido: true, itemChecklist: { obrigatorio: true } },
          { concluido: false, itemChecklist: { obrigatorio: false } },
        ],
      });
      (prisma.execucaoChecklist.update as jest.Mock<(...args: any[]) => any>).mockResolvedValue({ id: 1, status: 'CONCLUIDA', itens: [] });

      await service.finalizar(colaborador, 1);

      const args = (prisma.execucaoChecklist.update as jest.Mock<(...args: any[]) => any>).mock.calls[0][0];
      expect(args.data.status).toBe('CONCLUIDA');
      expect(args.data.finalizadaEm).toBeInstanceOf(Date);
    });

    it('cannot finalize an execution that is not EM_ANDAMENTO (already CONCLUIDA/CANCELADA)', async () => {
      (prisma.execucaoChecklist.findFirst as jest.Mock<(...args: any[]) => any>).mockResolvedValue({
        id: 1, empresaId: 1, status: 'CANCELADA', itens: [],
      });

      await expect(service.finalizar(colaborador, 1)).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('cancelar (section 4.7)', () => {
    it('only cancels an EM_ANDAMENTO execution and sets finalizadaEm', async () => {
      (prisma.execucaoChecklist.findFirst as jest.Mock<(...args: any[]) => any>).mockResolvedValue({ id: 1, empresaId: 1, status: 'EM_ANDAMENTO' });
      (prisma.execucaoChecklist.update as jest.Mock<(...args: any[]) => any>).mockResolvedValue({ id: 1, status: 'CANCELADA' });

      await service.cancelar(colaborador, 1);

      const args = (prisma.execucaoChecklist.update as jest.Mock<(...args: any[]) => any>).mock.calls[0][0];
      expect(args.data).toMatchObject({ status: 'CANCELADA' });
      expect(args.data.finalizadaEm).toBeInstanceOf(Date);
    });

    it('COLABORADOR cannot cancel another user execution (query scoped by usuarioId -> 404)', async () => {
      (prisma.execucaoChecklist.findFirst as jest.Mock<(...args: any[]) => any>).mockResolvedValue(null);

      await expect(service.cancelar(colaborador, 1)).rejects.toBeInstanceOf(NotFoundException);
      expect((prisma.execucaoChecklist.findFirst as jest.Mock<(...args: any[]) => any>).mock.calls[0][0].where).toMatchObject({ usuarioId: 2 });
    });

    it('rejects cancelling an already finalized execution', async () => {
      (prisma.execucaoChecklist.findFirst as jest.Mock<(...args: any[]) => any>).mockResolvedValue({ id: 1, empresaId: 1, status: 'CONCLUIDA' });

      await expect(service.cancelar(colaborador, 1)).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('progresso (section 4.5) - no division by zero', () => {
    it('returns 0% and podeFinalizar=true for an execution with zero items', async () => {
      (prisma.execucaoChecklist.findFirst as jest.Mock<(...args: any[]) => any>).mockResolvedValue({ id: 1, empresaId: 1, itens: [] });

      const result = await service.progresso(colaborador, 1);

      expect(result.percentual).toBe(0);
      expect(result.obrigatorios.podeFinalizar).toBe(true);
    });

    it('computes percentual, obrigatorios pendentes, and podeFinalizar correctly for a mixed set', async () => {
      (prisma.execucaoChecklist.findFirst as jest.Mock<(...args: any[]) => any>).mockResolvedValue({
        id: 1, empresaId: 1,
        itens: [
          { concluido: true, itemChecklist: { obrigatorio: true, descricao: 'A', ordem: 1 } },
          { concluido: false, itemChecklist: { obrigatorio: true, descricao: 'B', ordem: 2 } },
          { concluido: false, itemChecklist: { obrigatorio: false, descricao: 'C', ordem: 3 } },
        ],
      });

      const result = await service.progresso(colaborador, 1);

      expect(result.totalItens).toBe(3);
      expect(result.itensConcluidos).toBe(1);
      expect(result.percentual).toBe(33);
      expect(result.obrigatorios).toMatchObject({ total: 2, concluidos: 1, pendentes: 1, podeFinalizar: false });
      expect(result.itensObrigatoriosPendentes).toHaveLength(1);
    });
  });
});
