import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { StatusExecucao } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { AtualizarItemDto } from './dto/atualizar-item.dto';
import { ListarExecucoesQueryDto } from './dto/listar-execucoes-query.dto';

export interface UsuarioExecucao {
  id: number;
  empresaId: number;
  perfil: 'ADMIN' | 'COLABORADOR';
}

export interface CriarExecucaoInput {
  checklistId: number;
}

@Injectable()
export class ExecucaoService {
  constructor(private readonly prisma: PrismaService) {}

  async criar(usuario: UsuarioExecucao, input: CriarExecucaoInput) {
    const checklist = await this.prisma.checklist.findFirst({
      where: {
        id: input.checklistId,
        empresaId: usuario.empresaId,
        ativo: true,
      },
      include: {
        itens: {
          orderBy: {
            ordem: 'asc',
          },
        },
      },
    });

    if (!checklist) {
      throw new NotFoundException(
        'Checklist não encontrado, inativo ou não pertence à empresa do usuário.',
      );
    }

    if (checklist.itens.length === 0) {
      throw new BadRequestException(
        'Não é possível iniciar um checklist sem itens.',
      );
    }

    const execucaoExistente = await this.prisma.execucaoChecklist.findFirst({
      where: {
        checklistId: checklist.id,
        usuarioId: usuario.id,
        empresaId: usuario.empresaId,
        status: StatusExecucao.EM_ANDAMENTO,
      },
    });

    if (execucaoExistente) {
      return this.buscarPorId(usuario, execucaoExistente.id);
    }

    const execucao = await this.prisma.$transaction(async (transaction) => {
      const novaExecucao = await transaction.execucaoChecklist.create({
        data: {
          checklistId: checklist.id,
          usuarioId: usuario.id,
          empresaId: usuario.empresaId,
          status: StatusExecucao.EM_ANDAMENTO,
          iniciadaEm: new Date(),
        },
      });

      await transaction.execucaoItem.createMany({
        data: checklist.itens.map((item) => ({
          execucaoId: novaExecucao.id,
          itemChecklistId: item.id,
          concluido: false,
        })),
      });

      return novaExecucao;
    });

    return this.buscarPorId(usuario, execucao.id);
  }

  async buscarPorId(usuario: UsuarioExecucao, execucaoId: number) {
    const execucao = await this.prisma.execucaoChecklist.findFirst({
      where: {
        id: execucaoId,
        empresaId: usuario.empresaId,
        ...(usuario.perfil === 'COLABORADOR'
          ? {
              usuarioId: usuario.id,
            }
          : {}),
      },
      include: {
        checklist: {
          include: {
            itens: {
              orderBy: {
                ordem: 'asc',
              },
            },
          },
        },
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            perfil: true,
          },
        },
        itens: {
          include: {
            itemChecklist: true,
          },
          orderBy: {
            itemChecklist: {
              ordem: 'asc',
            },
          },
        },
      },
    });

    if (!execucao) {
      throw new NotFoundException(
        'Execução não encontrada ou acesso não permitido.',
      );
    }

    return this.formatarExecucao(execucao);
  }

  async listar(usuario: UsuarioExecucao, filtros: ListarExecucoesQueryDto = {}) {
    const page = Math.max(filtros.page ?? 1, 1);
    const limit = Math.min(Math.max(filtros.limit ?? 20, 1), 100);
    const skip = (page - 1) * limit;

    const where = {
      empresaId: usuario.empresaId,

      ...(usuario.perfil === 'COLABORADOR'
        ? {
            usuarioId: usuario.id,
          }
        : {}),

      ...(filtros.status
        ? {
            status: filtros.status,
          }
        : {}),

      ...(filtros.checklistId
        ? {
            checklistId: filtros.checklistId,
          }
        : {}),

      ...(filtros.usuarioId && usuario.perfil === 'ADMIN'
        ? {
            usuarioId: filtros.usuarioId,
          }
        : {}),

      ...(filtros.dataInicio || filtros.dataFim
        ? {
            iniciadaEm: {
              ...(filtros.dataInicio
                ? {
                    gte: filtros.dataInicio,
                  }
                : {}),
              ...(filtros.dataFim
                ? {
                    lte: filtros.dataFim,
                  }
                : {}),
            },
          }
        : {}),
    };

    const [execucoes, total] = await this.prisma.$transaction([
      this.prisma.execucaoChecklist.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          iniciadaEm: 'desc',
        },
        include: {
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
              perfil: true,
            },
          },
          itens: {
            select: {
              concluido: true,
              itemChecklist: {
                select: {
                  obrigatorio: true,
                },
              },
            },
          },
        },
      }),

      this.prisma.execucaoChecklist.count({
        where,
      }),
    ]);

    const dados = execucoes.map((execucao) => {
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
        checklist: execucao.checklist,
        usuario: execucao.usuario,
        status: execucao.status,
        iniciadaEm: execucao.iniciadaEm,
        finalizadaEm: execucao.finalizadaEm,
        progresso: {
          totalItens,
          itensConcluidos,
          percentual,
        },
      };
    });

    return {
      dados,
      paginacao: {
        pagina: page,
        limite: limit,
        total,
        totalPaginas: Math.ceil(total / limit),
      },
    };
  }

  async listarEmAndamento(usuario: UsuarioExecucao) {
    const where = {
      empresaId: usuario.empresaId,

      ...(usuario.perfil === 'COLABORADOR'
        ? {
            usuarioId: usuario.id,
          }
        : {}),
    };

    const execucoes = await this.prisma.execucaoChecklist.findMany({
      where: {
        ...where,
        status: StatusExecucao.EM_ANDAMENTO,
      },

      orderBy: {
        iniciadaEm: 'desc',
      },

      include: {
        checklist: {
          select: {
            id: true,
            titulo: true,
            periodicidade: true,
          },
        },

        itens: {
          select: {
            concluido: true,
            itemChecklist: {
              select: {
                id: true,
                descricao: true,
                obrigatorio: true,
                ordem: true,
              },
            },
          },
        },
      },
    });

    return execucoes.map((execucao) => {
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
        checklist: execucao.checklist,
        iniciadaEm: execucao.iniciadaEm,
        itens: execucao.itens,
        progresso: {
          totalItens,
          itensConcluidos,
          percentual,
        },
      };
    });
  }

  async atualizarItem(
    usuario: UsuarioExecucao,
    execucaoId: number,
    itemId: number,
    input: AtualizarItemDto,
  ) {
    const execucao = await this.prisma.execucaoChecklist.findFirst({
      where: {
        id: execucaoId,
        empresaId: usuario.empresaId,
        ...(usuario.perfil === 'COLABORADOR'
          ? {
              usuarioId: usuario.id,
            }
          : {}),
      },
    });

    if (!execucao) {
      throw new NotFoundException(
        'Execução não encontrada ou acesso não permitido.',
      );
    }

    if (execucao.status !== StatusExecucao.EM_ANDAMENTO) {
      throw new ConflictException(
        'Não é possível alterar itens de uma execução que não está em andamento.',
      );
    }

    const execucaoItem = await this.prisma.execucaoItem.findFirst({
      where: {
        id: itemId,
        execucaoId,
      },
      include: {
        itemChecklist: true,
      },
    });

    if (!execucaoItem) {
      throw new NotFoundException('Item da execução não encontrado.');
    }

    if (execucaoItem.itemChecklist.checklistId !== execucao.checklistId) {
      throw new BadRequestException(
        'O item não pertence ao checklist desta execução.',
      );
    }

    return this.prisma.execucaoItem.update({
      where: {
        id: execucaoItem.id,
      },
      data: {
        concluido: input.concluido,
        concluidoEm: input.concluido ? new Date() : null,
      },
      include: {
        itemChecklist: true,
      },
    });
  }

  async finalizar(usuario: UsuarioExecucao, execucaoId: number) {
    const execucao = await this.prisma.execucaoChecklist.findFirst({
      where: {
        id: execucaoId,
        empresaId: usuario.empresaId,
        ...(usuario.perfil === 'COLABORADOR'
          ? {
              usuarioId: usuario.id,
            }
          : {}),
      },
      include: {
        checklist: {
          include: {
            itens: {
              orderBy: {
                ordem: 'asc',
              },
            },
          },
        },
        itens: {
          include: {
            itemChecklist: true,
          },
        },
      },
    });

    if (!execucao) {
      throw new NotFoundException(
        'Execução não encontrada ou acesso não permitido.',
      );
    }

    if (execucao.status !== StatusExecucao.EM_ANDAMENTO) {
      throw new ConflictException(
        'Somente execuções em andamento podem ser finalizadas.',
      );
    }

    const itensObrigatoriosPendentes = execucao.itens.filter(
      (execucaoItem) =>
        execucaoItem.itemChecklist.obrigatorio && !execucaoItem.concluido,
    );

    if (itensObrigatoriosPendentes.length > 0) {
      throw new BadRequestException(
        `Existem ${itensObrigatoriosPendentes.length} item(ns) obrigatório(s) pendente(s).`,
      );
    }

    const finalizada = await this.prisma.execucaoChecklist.update({
      where: {
        id: execucao.id,
      },
      data: {
        status: StatusExecucao.CONCLUIDA,
        finalizadaEm: new Date(),
      },
      include: {
        checklist: true,
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            perfil: true,
          },
        },
        itens: {
          include: {
            itemChecklist: true,
          },
          orderBy: {
            itemChecklist: {
              ordem: 'asc',
            },
          },
        },
      },
    });

    return this.formatarExecucao(finalizada);
  }

  async cancelar(usuario: UsuarioExecucao, execucaoId: number) {
    const execucao = await this.prisma.execucaoChecklist.findFirst({
      where: {
        id: execucaoId,
        empresaId: usuario.empresaId,
        ...(usuario.perfil === 'COLABORADOR'
          ? {
              usuarioId: usuario.id,
            }
          : {}),
      },
    });

    if (!execucao) {
      throw new NotFoundException(
        'Execução não encontrada ou acesso não permitido.',
      );
    }

    if (execucao.status !== StatusExecucao.EM_ANDAMENTO) {
      throw new ConflictException(
        'Somente execuções em andamento podem ser canceladas.',
      );
    }

    return this.prisma.execucaoChecklist.update({
      where: {
        id: execucao.id,
      },
      data: {
        status: StatusExecucao.CANCELADA,
        finalizadaEm: new Date(),
      },
    });
  }

  async progresso(usuario: UsuarioExecucao, execucaoId: number) {
    const execucao = await this.prisma.execucaoChecklist.findFirst({
      where: {
        id: execucaoId,
        empresaId: usuario.empresaId,

        ...(usuario.perfil === 'COLABORADOR'
          ? {
              usuarioId: usuario.id,
            }
          : {}),
      },

      include: {
        itens: {
          include: {
            itemChecklist: true,
          },
        },
      },
    });

    if (!execucao) {
      throw new NotFoundException(
        'Execução não encontrada ou acesso não permitido.',
      );
    }

    const totalItens = execucao.itens.length;

    const itensConcluidos = execucao.itens.filter(
      (item) => item.concluido,
    ).length;

    const totalObrigatorios = execucao.itens.filter(
      (item) => item.itemChecklist.obrigatorio,
    ).length;

    const obrigatoriosConcluidos = execucao.itens.filter(
      (item) => item.itemChecklist.obrigatorio && item.concluido,
    ).length;

    const obrigatoriosPendentes = execucao.itens.filter(
      (item) => item.itemChecklist.obrigatorio && !item.concluido,
    );

    const percentual =
      totalItens === 0
        ? 0
        : Math.round((itensConcluidos / totalItens) * 100);

    return {
      execucaoId: execucao.id,
      status: execucao.status,
      totalItens,
      itensConcluidos,
      percentual,

      obrigatorios: {
        total: totalObrigatorios,
        concluidos: obrigatoriosConcluidos,
        pendentes: obrigatoriosPendentes.length,
        podeFinalizar: obrigatoriosPendentes.length === 0,
      },

      itensObrigatoriosPendentes: obrigatoriosPendentes.map((item) => ({
        id: item.id,
        itemChecklistId: item.itemChecklistId,
        descricao: item.itemChecklist.descricao,
        ordem: item.itemChecklist.ordem,
      })),
    };
  }

  private formatarExecucao(execucao: any) {
    const totalItens = execucao.itens?.length ?? 0;

    const itensConcluidos =
      execucao.itens?.filter((item: any) => item.concluido).length ?? 0;

    const percentual =
      totalItens === 0
        ? 0
        : Math.round((itensConcluidos / totalItens) * 100);

    const obrigatoriosPendentes =
      execucao.itens?.filter(
        (item: any) => item.itemChecklist?.obrigatorio && !item.concluido,
      ) ?? [];

    return {
      id: execucao.id,
      status: execucao.status,
      iniciadaEm: execucao.iniciadaEm,
      finalizadaEm: execucao.finalizadaEm,

      checklist: execucao.checklist
        ? {
            id: execucao.checklist.id,
            titulo: execucao.checklist.titulo,
            periodicidade: execucao.checklist.periodicidade,
          }
        : undefined,

      usuario: execucao.usuario
        ? {
            id: execucao.usuario.id,
            nome: execucao.usuario.nome,
            email: execucao.usuario.email,
            perfil: execucao.usuario.perfil,
          }
        : undefined,

      itens:
        execucao.itens?.map((item: any) => ({
          id: item.id,
          itemChecklistId: item.itemChecklistId,
          descricao: item.itemChecklist?.descricao,
          ordem: item.itemChecklist?.ordem,
          obrigatorio: item.itemChecklist?.obrigatorio,
          concluido: item.concluido,
          concluidoEm: item.concluidoEm,
        })) ?? [],

      progresso: {
        totalItens,
        itensConcluidos,
        percentual,
        podeFinalizar: obrigatoriosPendentes.length === 0,
        obrigatoriosPendentes: obrigatoriosPendentes.length,
      },
    };
  }
}
