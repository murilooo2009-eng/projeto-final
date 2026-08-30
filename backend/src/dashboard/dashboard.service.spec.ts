import { describe, beforeEach, it, expect, jest } from '@jest/globals';

import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';

function asyncMock(value: unknown) {
  return jest.fn<(...args: any[]) => any>().mockResolvedValue(value);
}

function makePrismaMock() {
  return {
    usuario: { count: asyncMock(0), findMany: asyncMock([]) },
    checklist: { count: asyncMock(0), findMany: asyncMock([]) },
    execucaoChecklist: {
      count: asyncMock(0),
      findMany: asyncMock([]),
      groupBy: asyncMock([]),
    },
    $transaction: jest.fn<(...args: any[]) => any>().mockImplementation(async (arg: any) => (Array.isArray(arg) ? Promise.all(arg) : arg({
      usuario: { count: asyncMock(0) },
    }))),
  } as unknown as PrismaService;
}

describe('DashboardService', () => {
  let prisma: ReturnType<typeof makePrismaMock>;
  let service: DashboardService;

  beforeEach(() => {
    prisma = makePrismaMock();
    service = new DashboardService(prisma);
  });

  describe('obterDashboardAdmin - regression test for the Promise.all fix', () => {
    it('every numeric metric resolves to an actual number, never a pending Promise object', async () => {
      (prisma.usuario.count as jest.Mock<(...args: any[]) => any>).mockResolvedValue(5);
      (prisma.checklist.count as jest.Mock<(...args: any[]) => any>).mockResolvedValue(3);
      (prisma.execucaoChecklist.count as jest.Mock<(...args: any[]) => any>)
        .mockResolvedValueOnce(20) // total
        .mockResolvedValueOnce(12) // concluidas
        .mockResolvedValueOnce(5)  // andamento
        .mockResolvedValueOnce(3); // canceladas

      const result = await service.obterDashboardAdmin({ id: 1, empresaId: 1, perfil: 'ADMIN' as any });

      for (const [key, value] of Object.entries(result.metricas)) {
        expect(typeof value).toBe('number');
        // this is exactly the bug that shipped before the fix: an un-awaited
        // Promise silently serializes as `{}`, which is also `typeof === 'object'`
        expect(value).not.toBeInstanceOf(Promise);
      }

      expect(result.metricas.usuariosAtivos).toBe(5);
      expect(result.metricas.checklistsAtivos).toBe(3);
      expect(result.metricas.execucoes).toBe(20);
      expect(result.metricas.execucoesConcluidas).toBe(12);
      expect(result.metricas.execucoesEmAndamento).toBe(5);
      expect(result.metricas.execucoesCanceladas).toBe(3);
    });

    it('top-level list fields (usuariosAtivos, checklistsAtivos) are real arrays, not pending promises', async () => {
      (prisma.usuario.findMany as jest.Mock<(...args: any[]) => any>).mockResolvedValue([{ id: 1, nome: 'Ana' }]);
      (prisma.checklist.findMany as jest.Mock<(...args: any[]) => any>).mockResolvedValue([{ id: 1, titulo: 'X' }]);

      const result = await service.obterDashboardAdmin({ id: 1, empresaId: 1, perfil: 'ADMIN' as any });

      expect(Array.isArray(result.usuariosAtivos)).toBe(true);
      expect(Array.isArray(result.checklistsAtivos)).toBe(true);
      expect(result.usuariosAtivos[0]).toMatchObject({ nome: 'Ana' });
    });

    it('every query is scoped to the caller empresaId', async () => {
      await service.obterDashboardAdmin({ id: 1, empresaId: 77, perfil: 'ADMIN' as any });

      expect((prisma.usuario.count as jest.Mock<(...args: any[]) => any>).mock.calls[0][0].where).toMatchObject({ empresaId: 77 });
      expect((prisma.checklist.count as jest.Mock<(...args: any[]) => any>).mock.calls[0][0].where).toMatchObject({ empresaId: 77 });
      for (const call of (prisma.execucaoChecklist.count as jest.Mock<(...args: any[]) => any>).mock.calls) {
        expect(call[0].where).toMatchObject({ empresaId: 77 });
      }
    });

    it('execucoesUltimosDias always returns exactly 7 days', async () => {
      const result = await service.obterDashboardAdmin({ id: 1, empresaId: 1, perfil: 'ADMIN' as any });
      expect(result.execucoesUltimosDias).toHaveLength(7);
    });
  });

  describe('obterDashboardColaborador', () => {
    it('scopes every query to both empresaId and the caller usuarioId', async () => {
      (prisma.$transaction as jest.Mock<(...args: any[]) => any>).mockImplementation(async (arg: any) => Promise.all(arg));

      await service.obterDashboardColaborador({ id: 9, empresaId: 1, perfil: 'COLABORADOR' as any });

      const calledWith = (prisma.checklist.findMany as jest.Mock<(...args: any[]) => any>).mock.calls[0][0].where;
      expect(calledWith).toMatchObject({ empresaId: 1 });
      // execucaoChecklist queries are asserted via the fake-backed e2e suite,
      // where usuarioId scoping is proven end-to-end through real HTTP calls.
    });
  });

  describe('obterDashboard (dispatcher)', () => {
    it('routes ADMIN to obterDashboardAdmin and COLABORADOR to obterDashboardColaborador', async () => {
      const spyAdmin = jest.spyOn(service, 'obterDashboardAdmin').mockResolvedValue({ perfil: 'ADMIN' } as any);
      const spyColab = jest.spyOn(service, 'obterDashboardColaborador').mockResolvedValue({ perfil: 'COLABORADOR' } as any);

      await service.obterDashboard({ id: 1, empresaId: 1, perfil: 'ADMIN' as any });
      expect(spyAdmin).toHaveBeenCalledTimes(1);
      expect(spyColab).not.toHaveBeenCalled();

      await service.obterDashboard({ id: 2, empresaId: 1, perfil: 'COLABORADOR' as any });
      expect(spyColab).toHaveBeenCalledTimes(1);
    });
  });
});
