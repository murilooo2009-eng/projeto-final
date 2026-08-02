import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExecucaoDto } from './dto/create-execucao.dto';

@Injectable()
export class ExecucaoService {

  constructor(private prisma: PrismaService) {}

  async executar(dto: CreateExecucaoDto, usuarioId: number) {

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId }
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const checklist = await this.prisma.checklist.findFirst({
      where: {
        id: dto.checklistId,
        empresaId: usuario.empresaId,
        ativo: true
      },
      include: {
        itens: {
          orderBy: {
            id: 'asc'
          }
        }
      }
    });

    if (!checklist) {
      throw new NotFoundException('Checklist não encontrado');
    }

    const itensEnviados =
  new Map(
    dto.itens.map(
      (item) => [
        item.itemId,
        item,
      ],
    ),
  );

    const idsRecebidos =
  dto.itens.map(
    item => item.itemId,
  );

const idsUnicos =
  new Set(idsRecebidos);

if (
  idsUnicos.size !==
  idsRecebidos.length
) {
  throw new BadRequestException(
    'Existem itens duplicados na execução',
  );
}

    const itemIdsChecklist = new Set(
      checklist.itens.map((i) => i.id)
    );

    for (const item of dto.itens) {
      if (!itemIdsChecklist.has(item.itemId)) {
        throw new BadRequestException(
          `Item ${item.itemId} não pertence ao checklist`
        );
      }
    }

    const ids = dto.itens.map(i => i.itemId);

    const duplicados = ids.filter(
      (id, idx) => ids.indexOf(id) !== idx
    );

    if (duplicados.length) {
      throw new BadRequestException(
        'Itens duplicados na execução'
      );
    }

    const idsDoChecklist =
  checklist.itens.map(
    item => item.id,
  );

  const itensAusentes =
  idsDoChecklist.filter(
    id =>
      !itensEnviados.has(id),
  );

  if (
  itensAusentes.length > 0
) {
  throw new BadRequestException(
    'Todos os itens do checklist devem ser enviados',
  );
}

const idsValidos =
  new Set(
    idsDoChecklist,
  );

const itensInvalidos =
  idsRecebidos.filter(
    id =>
      !idsValidos.has(id),
  );

  if (
  itensInvalidos.length > 0
) {
  throw new BadRequestException(
    'A execução contém itens que não pertencem ao checklist',
  );
}

const obrigatoriosPendentes =
  checklist.itens.filter(
    item => {
      if (!item.obrigatorio) {
        return false;
      }

      const itemExecutado =
        itensEnviados.get(
          item.id,
        );

      return (
        !itemExecutado ||
        !itemExecutado.concluido
      );
    },
  );

  if (
  obrigatoriosPendentes.length > 0
) {
  throw new BadRequestException(
    'Não é possível concluir o checklist porque existem itens obrigatórios pendentes',
  );
}

const totalItens =
  checklist.itens.length;

  const itensConcluidos =
  checklist.itens.filter(
    item => {
      const execucao =
        itensEnviados.get(
          item.id,
        );

      return (
        execucao?.concluido ===
        true
      );
    },
  ).length;

  const percentual =
  totalItens === 0
    ? 0
    : Number(
        (
          itensConcluidos /
          totalItens *
          100
        ).toFixed(2),
      );

      const possuiObrigatoriosPendentes =
  obrigatoriosPendentes.length > 0;

const status =
  possuiObrigatoriosPendentes
    ? 'PENDENTE'
    : percentual === 100
      ? 'CONCLUIDA'
      : 'PENDENTE';
    

    const execucao = await this.prisma.execucaoChecklist.create({
      data: {
        checklistId: dto.checklistId,
        usuarioId: usuarioId,
        dataExecucao: new Date(),
        status: status,
        percentualConclusao: percentual,
        itens: {
          create: dto.itens.map((item) => ({
            itemId: item.itemId,
            concluido: item.concluido
          }))
        }
      },
      include: {
        itens: true
      }
    });

    return execucao;

  }

  async findAll(usuarioId: number) {

  const usuario = await this.prisma.usuario.findUnique({
    where: { id: usuarioId }
  });

  if (!usuario) {
    throw new NotFoundException('Usuário não encontrado');
  }

  return this.prisma.execucaoChecklist.findMany({
    where: {
      checklist: {
        empresaId: usuario.empresaId
      }
    },
    include: {
      checklist: true,
      usuario: {
        select: {
          id: true,
          nome: true
        }
      }
    },
    orderBy: {
      dataExecucao: 'desc'
    }
  });

}

async findOne(id: number, usuarioId: number) {

  const usuario = await this.prisma.usuario.findUnique({
    where: { id: usuarioId }
  });

  if (!usuario) {
    throw new NotFoundException('Usuário não encontrado');
  }

  const execucao = await this.prisma.execucaoChecklist.findFirst({
    where: {
      id,
      checklist: {
        empresaId: usuario.empresaId
      }
    },
    include: {
      checklist: true,
      usuario: {
        select: {
          id: true,
          nome: true
        }
      },
      itens: {
        include: {
          item: true
        }
      }
    }
  });

  if (!execucao) {
    throw new NotFoundException('Execução não encontrada');
  }

  return execucao;

}

}
