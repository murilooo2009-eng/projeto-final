import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateChecklistDto } from './dto/create-checklist.dto';
import { UpdateChecklistDto } from './dto/update-checklist.dto';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@Injectable()
export class ChecklistService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    dto: CreateChecklistDto,
    empresaId: number,
  ) {
    return this.prisma.checklist.create({
      data: {
        titulo:
          dto.titulo.trim(),

        periodicidade:
          dto.periodicidade ?? 'DIARIO',

        horarioDisponivelInicio:
          dto.horarioDisponivelInicio,

        horarioDisponivelFim:
          dto.horarioDisponivelFim,

        empresaId,
      },

      include: {
        itens: true,
      },
    });
  }

  async findAll(
    usuarioId: number,
    empresaId: number,
  ) {
    return this.prisma.checklist.findMany({
      where: {
        empresaId,
      },

      orderBy: {
        createdAt: 'desc',
      },

      include: {
        itens: {
          orderBy: {
            ordem: 'asc',
          },
        },
      },
    });
  }

  async findOne(
    id: number,
    usuarioId: number,
    empresaId: number,
  ) {
    const checklist =
      await this.prisma.checklist.findFirst({
        where: {
          id,
          empresaId,
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
        'Checklist não encontrado',
      );
    }

    return checklist;
  }

  async update(
    id: number,
    dto: UpdateChecklistDto,
    empresaId: number,
  ) {
    await this.findOne(
      id,
      0,
      empresaId,
    );

    return this.prisma.checklist.update({
      where: {
        id,
      },

      data: {
        titulo:
          dto.titulo?.trim(),

        periodicidade:
          dto.periodicidade,

        ativo:
          dto.ativo,

        horarioDisponivelInicio:
          dto.horarioDisponivelInicio,

        horarioDisponivelFim:
          dto.horarioDisponivelFim,
      },
    });
  }

  async createItem(
    checklistId: number,
    dto: CreateItemDto,
    empresaId: number,
  ) {
    await this.findOne(
      checklistId,
      0,
      empresaId,
    );

    const ultimo =
      await this.prisma.itemChecklist.findFirst({
        where: {
          checklistId,
        },

        orderBy: {
          ordem: 'desc',
        },
      });

    const ordem =
      dto.ordem ??
      (ultimo
        ? ultimo.ordem + 1
        : 1);

    return this.prisma.itemChecklist.create({
      data: {
        descricao:
          dto.descricao.trim(),

        ordem,

        obrigatorio:
          dto.obrigatorio ?? false,

        checklistId,
      },
    });
  }

  async updateItem(
    checklistId: number,
    itemId: number,
    dto: UpdateItemDto,
    empresaId: number,
  ) {
    await this.findOne(
      checklistId,
      0,
      empresaId,
    );

    const item =
      await this.prisma.itemChecklist.findFirst({
        where: {
          id: itemId,
          checklistId,
        },
      });

    if (!item) {
      throw new NotFoundException(
        'Item não encontrado',
      );
    }

    return this.prisma.itemChecklist.update({
      where: {
        id: itemId,
      },

      data: {
        descricao:
          dto.descricao?.trim(),

        ordem:
          dto.ordem,

        obrigatorio:
          dto.obrigatorio,
      },
    });
  }

  async removeItem(
    checklistId: number,
    itemId: number,
    empresaId: number,
  ) {
    await this.findOne(
      checklistId,
      0,
      empresaId,
    );

    const item =
      await this.prisma.itemChecklist.findFirst({
        where: {
          id: itemId,
          checklistId,
        },
      });

    if (!item) {
      throw new NotFoundException(
        'Item não encontrado',
      );
    }

    await this.prisma.itemChecklist.delete({
      where: {
        id: itemId,
      },
    });

    return {
      message:
        'Item removido com sucesso',
    };
  }

  async remove(
    id: number,
    empresaId: number,
  ) {
    await this.findOne(
      id,
      0,
      empresaId,
    );

    await this.prisma.checklist.delete({
      where: {
        id,
      },
    });

    return {
      message:
        'Checklist removido com sucesso',
    };
  }
}