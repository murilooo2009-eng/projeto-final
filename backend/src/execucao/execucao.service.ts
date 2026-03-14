import { Injectable, NotFoundException } from '@nestjs/common';
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
        empresaId: usuario.empresaId
      },
      include: {
        itens: true
      }
    });

    if (!checklist) {
      throw new NotFoundException('Checklist não encontrado');
    }

    const execucao = await this.prisma.execucaoChecklist.create({
      data: {
        checklistId: dto.checklistId,
        usuarioId: usuarioId,
        dataExecucao: new Date(),
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
