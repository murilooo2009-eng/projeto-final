import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { UpdateChecklistDto } from './dto/update-checklist.dto';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@Injectable()
export class ChecklistService {

  constructor(private prisma: PrismaService) {}

  private async getUsuario(usuarioId: number) {

    const usuario = await this.prisma.usuario.findFirst({
      where: { id: usuarioId },
      select: { empresaId: true }
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return usuario;
  }

  async create(dto: CreateChecklistDto, usuarioId: number) {

    const usuario = await this.getUsuario(usuarioId);

    return this.prisma.checklist.create({
      data: {
        titulo: dto.titulo,
        periodicidade: dto.periodicidade || 'DIARIO',
        empresaId: usuario.empresaId,
      }
    });

  }

  async createItem(
  checklistId: number,
  dto: CreateItemDto,
  usuarioId: number
) {

  const usuario = await this.getUsuario(usuarioId);

  if (!usuario) {
    throw new NotFoundException('Usuário não encontrado');
  }

  const checklist = await this.prisma.checklist.findFirst({
    where: {
      id: checklistId,
      empresaId: usuario.empresaId
    }
  });

  if (!checklist) {
    throw new NotFoundException('Checklist não encontrado');
  }

  const ultimoItem = await this.prisma.checklistItem.findFirst({
    where: { checklistId },
    orderBy: { ordem: 'desc' }
  });

  const ordem = dto.ordem ?? (ultimoItem ? ultimoItem.ordem + 1 : 1);

  return this.prisma.checklistItem.create({
    data: {
      descricao: dto.descricao,
      obrigatorio: dto.obrigatorio ?? false,
      ordem,
      checklistId
    }
  });

}

  async findAll(usuarioId: number) {

    const usuario = await this.getUsuario(usuarioId);

    return this.prisma.checklist.findMany({
      where: {
        empresaId: usuario.empresaId
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        itens: {
          orderBy: { ordem: 'asc' }
        }
      }
    });

  }

  async findOne(id: number, usuarioId: number) {

    const usuario = await this.getUsuario(usuarioId);

    const checklist = await this.prisma.checklist.findFirst({
      where: {
        id,
        empresaId: usuario.empresaId
      }
    });

    if (!checklist) {
      throw new NotFoundException('Checklist não encontrado');
    }

    return this.prisma.checklist.findFirst({
  where: {
    id,
    empresaId: usuario.empresaId
  },
  include: {
    itens: {
      orderBy: { ordem: 'asc' }
    }
  }
});

  }

  async update(id: number, dto: UpdateChecklistDto, usuarioId: number) {

    await this.findOne(id, usuarioId);

    return this.prisma.checklist.update({
      where: { id },
      data: dto
    });

  }

   async updateItem(
  checklistId: number,
  itemId: number,
  dto: UpdateItemDto,
  usuarioId: number
) {

  const usuario = await this.getUsuario(usuarioId);

  const checklist = await this.prisma.checklist.findFirst({
    where: {
      id: checklistId,
      empresaId: usuario.empresaId
    }
  });

  if (!checklist) {
    throw new NotFoundException('Checklist não encontrado');
  }

  const item = await this.prisma.checklistItem.findFirst({
    where: {
      id: itemId,
      checklistId
    }
  });

  if (!item) {
    throw new NotFoundException('Item não encontrado');
  }

  return this.prisma.checklistItem.update({
    where: { id: itemId },
    data: dto
  });

}

  async remove(id: number, usuarioId: number) {

    await this.findOne(id, usuarioId);

    return this.prisma.checklist.delete({
      where: { id }
    });

  }

  async removeItem(
  checklistId: number,
  itemId: number,
  usuarioId: number
) {

  const usuario = await this.getUsuario(usuarioId);

  const checklist = await this.prisma.checklist.findFirst({
    where: {
      id: checklistId,
      empresaId: usuario.empresaId
    }
  });

  if (!checklist) {
    throw new NotFoundException('Checklist não encontrado');
  }

  const item = await this.prisma.checklistItem.findFirst({
    where: {
      id: itemId,
      checklistId
    }
  });

  if (!item) {
    throw new NotFoundException('Item não encontrado');
  }

  await this.prisma.checklistItem.delete({
    where: { id: itemId }
  });

  return { message: 'Item removido com sucesso' };

}

}