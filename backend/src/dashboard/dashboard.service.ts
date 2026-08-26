import { Injectable } from '@nestjs/common';
import { Perfil, StatusExecucao } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

export interface DashboardUsuario {
  id: number;
  empresaId: number;
  perfil: Perfil;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async obterDashboard(usuario: DashboardUsuario) {
    if (usuario.perfil === Perfil.ADMIN) {
      return this.obterDashboardAdmin(usuario);
    }

    return this.obterDashboardColaborador(usuario);
  }

  async obterDashboardAdmin(usuario: DashboardUsuario) {
    const empresaId = usuario.empresaId;

    const [
      totalUsuariosAtivos,
      totalChecklistsAtivos,
      totalExecucoes,
      totalExecucoesConcluidas,
      totalExecucoesAndamento,
      totalExecucoesCanceladas,
      execucoesRecentes,
      execucoesPorStatus,
      checklistsMaisExecutados,
      execucoesUltimosDias,
      usuariosAtivos,
      checklistsAtivos,
    ] = await Promise.all([
      this.prisma.usuario.count({
        where: {
          empresaId,
          ativo: true,
        },
      }),

      this.prisma.checklist.count({
        where: {
          empresaId,
          ativo: true,
        },
      }),

      this.prisma.execucaoChecklist.count({
        where: {
          empresaId,
        },
      }),

      this.prisma.execucaoChecklist.count({
        where: {
          empresaId,
          status: StatusExecucao.CONCLUIDA,
        },
      }),

      this.prisma.execucaoChecklist.count({
        where: {
          empresaId,
          status: StatusExecucao.EM_ANDAMENTO,
        },
      }),

      this.prisma.execucaoChecklist.count({
        where: {
          empresaId,
          status: StatusExecucao.CANCELADA,
        },
      }),

      this.prisma.execucaoChecklist.findMany({
        where: {
          empresaId,
        },
        orderBy: {
          iniciadaEm: 'desc',
        },
        take: 10,
        select: {
          id: true,
          status: true,
          iniciadaEm: true,
          finalizadaEm: true,
          checklist: {
            select: {
              id: true,
              titulo: true,
              periodicidade: true,
            },
          },
          usuario: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
          itens: {
            select: {
              concluido: true,
            },
          },
        },
      }),

      this.prisma.execucaoChecklist.groupBy({
        by: ['status'],
        where: {
          empresaId,
        },
        _count: {
          id: true,
        },
      }),

      this.prisma.execucaoChecklist.groupBy({
        by: ['checklistId'],
        where: {
          empresaId,
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 5,
      }),

      this.obterExecucoesUltimosDias(empresaId, 7),

      this.prisma.usuario.findMany({
        where: {
          empresaId,
          ativo: true,
        },
        select: {
          id: true,
          nome: true,
          perfil: true,
        },
        orderBy: {
          nome: 'asc',
        },
      }),

      this.prisma.checklist.findMany({
        where: {
          empresaId,
          ativo: true,
        },
        select: {
          id: true,
          titulo: true,
          periodicidade: true,
        },
        orderBy: {
          titulo: 'asc',
        },
      }),
    ]);

    const mediaConclusao = await this.calcularMediaConclusao(empresaId);

    const tarefasPendentes = await this.obterTarefasPendentes(empresaId);

    const checklistsExecutados = await this.enriquecerChecklistsMaisExecutados(
      checklistsMaisExecutados,
    );

    return {
      perfil: Perfil.ADMIN,

      metricas: {
        usuariosAtivos: totalUsuariosAtivos,
        checklistsAtivos: totalChecklistsAtivos,
        execucoes: totalExecucoes,
        execucoesConcluidas: totalExecucoesConcluidas,
        execucoesEmAndamento: totalExecucoesAndamento,
        execucoesCanceladas: totalExecucoesCanceladas,
        tarefasPendentes,
        mediaConclusao,
      },

      execucoesPorStatus: execucoesPorStatus.map((item) => ({
        status: item.status,
        quantidade: item._count.id,
      })),

      execucoesUltimosDias,

      checklistsMaisExecutados: checklistsExecutados,

      execucoesRecentes: execucoesRecentes.map((execucao) => {
        const totalItens = execucao.itens.length;

        const itensConcluidos = execucao.itens.filter(
          (item) => item.concluido,
        ).length;

        const percentual =
          totalItens === 0
            ? 0
            : Math.round((itensConcluidos / totalItens) * 100);

        return {
          id: execucao.id,
          status: execucao.status,
          iniciadaEm: execucao.iniciadaEm,
          finalizadaEm: execucao.finalizadaEm,
          checklist: execucao.checklist,
          usuario: execucao.usuario,
          progresso: {
            totalItens,
            itensConcluidos,
            percentual,
          },
        };
      }),

      usuariosAtivos,

      checklistsAtivos,
    };
  }

  async obterDashboardColaborador(usuario: DashboardUsuario) {
    const empresaId = usuario.empresaId;
    const usuarioId = usuario.id;

    const [
      checklistsDisponiveis,
      execucoesConcluidas,
      execucoesAndamento,
      execucoesRecentes,
      totalExecucoes,
    ] = await this.prisma.$transaction([
      this.prisma.checklist.findMany({
        where: {
          empresaId,
          ativo: true,
        },
        orderBy: {
          titulo: 'asc',
        },
        select: {
          id: true,
          titulo: true,
          periodicidade: true,
          horarioDisponivelInicio: true,
          horarioDisponivelFim: true,
          itens: {
            orderBy: {
              ordem: 'asc',
            },
            select: {
              id: true,
              descricao: true,
              ordem: true,
              obrigatorio: true,
            },
          },
        },
      }),

      this.prisma.execucaoChecklist.count({
        where: {
          empresaId,
          usuarioId,
          status: StatusExecucao.CONCLUIDA,
        },
      }),

      this.prisma.execucaoChecklist.count({
        where: {
          empresaId,
          usuarioId,
          status: StatusExecucao.EM_ANDAMENTO,
        },
      }),

      this.prisma.execucaoChecklist.findMany({
        where: {
          empresaId,
          usuarioId,
        },
        orderBy: {
          iniciadaEm: 'desc',
        },
        take: 10,
        select: {
          id: true,
          status: true,
          iniciadaEm: true,
          finalizadaEm: true,
          checklist: {
            select: {
              id: true,
              titulo: true,
              periodicidade: true,
            },
          },
          itens: {
            select: {
              id: true,
              concluido: true,
              concluidoEm: true,
              itemChecklist: {
                select: {
                  id: true,
                  descricao: true,
                  ordem: true,
                  obrigatorio: true,
                },
              },
            },
          },
        },
      }),

      this.prisma.execucaoChecklist.count({
        where: {
          empresaId,
          usuarioId,
        },
      }),
    ]);

    const execucoes = await this.obterExecucoesColaborador(usuarioId, empresaId);

    const mediaConclusao = await this.calcularMediaConclusaoUsuario(
      usuarioId,
      empresaId,
    );

    const tarefasPendentes = execucoesAndamento;

    const checklistsComProgresso = checklistsDisponiveis.map((checklist) => {
      const execucao = execucoes.find(
        (item) =>
          item.checklistId === checklist.id &&
          item.status === StatusExecucao.EM_ANDAMENTO,
      );

      const totalItens = checklist.itens.length;

      const itensConcluidos =
        execucao?.itens.filter((item) => item.concluido).length ?? 0;

      const percentual =
        totalItens === 0
          ? 0
          : Math.round((itensConcluidos / totalItens) * 100);

      return {
        id: checklist.id,
        titulo: checklist.titulo,
        periodicidade: checklist.periodicidade,
        horarioDisponivelInicio: checklist.horarioDisponivelInicio,
        horarioDisponivelFim: checklist.horarioDisponivelFim,
        totalItens,
        itensConcluidos,
        percentual,
        emAndamento: Boolean(execucao),
        execucaoId: execucao?.id ?? null,
      };
    });

    return {
      perfil: Perfil.COLABORADOR,

      metricas: {
        checklistsDisponiveis: checklistsDisponiveis.length,
        tarefasPendentes,
        execucoesConcluidas,
        execucoesEmAndamento: execucoesAndamento,
        totalExecucoes,
        mediaConclusao,
      },

      checklists: checklistsComProgresso,

      execucoesEmAndamento: execucoesRecentes
        .filter((execucao) => execucao.status === StatusExecucao.EM_ANDAMENTO)
        .map((execucao) => this.formatarExecucao(execucao)),

      execucoesRecentes: execucoesRecentes.map((execucao) =>
        this.formatarExecucao(execucao),
      ),
    };
  }

  private async obterExecucoesUltimosDias(
    empresaId: number,
    quantidadeDias: number,
  ) {
    const hoje = new Date();

    const resultado: { data: string; quantidade: number; concluidas: number }[] = [];

    for (let i = quantidadeDias - 1; i >= 0; i--) {
      const inicio = new Date(hoje);

      inicio.setHours(0, 0, 0, 0);
      inicio.setDate(hoje.getDate() - i);

      const fim = new Date(inicio);

      fim.setHours(23, 59, 59, 999);

      const quantidade = await this.prisma.execucaoChecklist.count({
        where: {
          empresaId,
          iniciadaEm: {
            gte: inicio,
            lte: fim,
          },
        },
      });

      const concluidas = await this.prisma.execucaoChecklist.count({
        where: {
          empresaId,
          status: StatusExecucao.CONCLUIDA,
          iniciadaEm: {
            gte: inicio,
            lte: fim,
          },
        },
      });

      resultado.push({
        data: inicio.toISOString().split('T')[0],
        quantidade,
        concluidas,
      });
    }

    return resultado;
  }

  private async calcularMediaConclusao(empresaId: number) {
    const execucoes = await this.prisma.execucaoChecklist.findMany({
      where: {
        empresaId,
        status: StatusExecucao.CONCLUIDA,
      },
      select: {
        itens: {
          select: {
            concluido: true,
          },
        },
      },
    });

    if (execucoes.length === 0) {
      return 0;
    }

    let totalItens = 0;
    let itensConcluidos = 0;

    for (const execucao of execucoes) {
      totalItens += execucao.itens.length;
      itensConcluidos += execucao.itens.filter((item) => item.concluido).length;
    }

    if (totalItens === 0) {
      return 0;
    }

    return Math.round((itensConcluidos / totalItens) * 100);
  }

  private async calcularMediaConclusaoUsuario(
    usuarioId: number,
    empresaId: number,
  ) {
    const execucoes = await this.prisma.execucaoChecklist.findMany({
      where: {
        empresaId,
        usuarioId,
        status: StatusExecucao.CONCLUIDA,
      },
      select: {
        itens: {
          select: {
            concluido: true,
          },
        },
      },
    });

    if (execucoes.length === 0) {
      return 0;
    }

    let totalItens = 0;
    let itensConcluidos = 0;

    for (const execucao of execucoes) {
      totalItens += execucao.itens.length;
      itensConcluidos += execucao.itens.filter((item) => item.concluido).length;
    }

    if (totalItens === 0) {
      return 0;
    }

    return Math.round((itensConcluidos / totalItens) * 100);
  }

  private async obterTarefasPendentes(empresaId: number) {
    const execucoes = await this.prisma.execucaoChecklist.findMany({
      where: {
        empresaId,
        status: StatusExecucao.EM_ANDAMENTO,
      },
      select: {
        itens: {
          where: {
            concluido: false,
          },
          select: {
            id: true,
            itemChecklist: {
              select: {
                obrigatorio: true,
              },
            },
          },
        },
      },
    });

    return execucoes.reduce((total, execucao) => total + execucao.itens.length, 0);
  }

  private async enriquecerChecklistsMaisExecutados(
    dados: Array<{
      checklistId: number;
      _count: {
        id: number;
      };
    }>,
  ) {
    if (dados.length === 0) {
      return [];
    }

    const ids = dados.map((item) => item.checklistId);

    const checklists = await this.prisma.checklist.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      select: {
        id: true,
        titulo: true,
        periodicidade: true,
      },
    });

    return dados.map((item) => {
      const checklist = checklists.find(
        (check) => check.id === item.checklistId,
      );

      return {
        checklistId: item.checklistId,
        titulo: checklist?.titulo ?? '',
        periodicidade: checklist?.periodicidade ?? null,
        quantidadeExecucoes: item._count.id,
      };
    });
  }

  private async obterExecucoesColaborador(usuarioId: number, empresaId: number) {
    return this.prisma.execucaoChecklist.findMany({
      where: {
        usuarioId,
        empresaId,
        status: StatusExecucao.EM_ANDAMENTO,
      },
      select: {
        id: true,
        checklistId: true,
        status: true,
        itens: {
          select: {
            id: true,
            concluido: true,
            itemChecklist: {
              select: {
                id: true,
                descricao: true,
                ordem: true,
                obrigatorio: true,
              },
            },
          },
        },
      },
    });
  }

  private formatarExecucao(execucao: any) {
    const totalItens = execucao.itens?.length ?? 0;

    const itensConcluidos =
      execucao.itens?.filter((item: any) => item.concluido).length ?? 0;

    const percentual =
      totalItens === 0
        ? 0
        : Math.round((itensConcluidos / totalItens) * 100);

    return {
      id: execucao.id,
      status: execucao.status,
      iniciadaEm: execucao.iniciadaEm,
      finalizadaEm: execucao.finalizadaEm ?? null,
      checklist: execucao.checklist,
      progresso: {
        totalItens,
        itensConcluidos,
        percentual,
      },
      itens:
        execucao.itens?.map((item: any) => ({
          id: item.id,
          concluido: item.concluido,
          concluidoEm: item.concluidoEm ?? null,
          itemChecklist: item.itemChecklist,
        })) ?? [],
    };
  }
}
