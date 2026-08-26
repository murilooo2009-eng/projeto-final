import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';

import { CreateUsuarioDto } from './dto/create-usuario.dto';

@Injectable()
export class UsuariosService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async findAll(
    empresaId: number,
  ) {
    return this.prisma.usuario.findMany({
      where: {
        empresaId,
      },

      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        ativo: true,
        empresaId: true,
        createdAt: true,
        updatedAt: true,
      },

      orderBy: {
        nome: 'asc',
      },
    });
  }

  async findOne(
    id: number,
    empresaId: number,
  ) {
    const usuario =
      await this.prisma.usuario.findFirst({
        where: {
          id,
          empresaId,
        },

        select: {
          id: true,
          nome: true,
          email: true,
          perfil: true,
          ativo: true,
          empresaId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

    if (!usuario) {
      throw new NotFoundException(
        'Usuário não encontrado',
      );
    }

    return usuario;
  }

  async create(
    dto: CreateUsuarioDto,
    empresaId: number,
  ) {
    const email =
      dto.email
        .trim()
        .toLowerCase();

    const existe =
      await this.prisma.usuario.findUnique({
        where: {
          email,
        },
      });

    if (existe) {
      throw new ConflictException(
        'E-mail já cadastrado',
      );
    }

    if (!dto.senha) {
      throw new ConflictException(
        'Senha é obrigatória',
      );
    }

    const senhaHash =
      await bcrypt.hash(
        dto.senha,
        12,
      );

    const usuario =
      await this.prisma.usuario.create({
        data: {
          nome:
            dto.nome.trim(),

          email,

          senhaHash,

          perfil:
            dto.perfil ??
            'COLABORADOR',

          empresaId,
        },
      });

    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      ativo: usuario.ativo,
      empresaId: usuario.empresaId,
    };
  }

  async update(
    id: number,
    dto: CreateUsuarioDto,
    empresaId: number,
  ) {
    await this.findOne(
      id,
      empresaId,
    );

    const data: {
      nome?: string;
      email?: string;
      perfil?: any;
      senhaHash?: string;
    } = {};

    if (dto.nome) {
      data.nome =
        dto.nome.trim();
    }

    if (dto.email) {
      data.email =
        dto.email
          .trim()
          .toLowerCase();
    }

    if (dto.perfil) {
      data.perfil =
        dto.perfil;
    }

    if (dto.senha) {
      data.senhaHash =
        await bcrypt.hash(
          dto.senha,
          12,
        );
    }

    try {
      const usuario =
        await this.prisma.usuario.update({
          where: {
            id,
          },

          data,
        });

      return {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        ativo: usuario.ativo,
        empresaId: usuario.empresaId,
      };
    } catch (error) {
      const prismaError =
        error as {
          code?: string;
        };

      if (
        prismaError.code ===
        'P2002'
      ) {
        throw new ConflictException(
          'E-mail já cadastrado',
        );
      }

      throw error;
    }
  }

  async updateStatus(
    id: number,
    ativo: boolean,
    empresaId: number,
  ) {
    await this.findOne(
      id,
      empresaId,
    );

    return this.prisma.usuario.update({
      where: {
        id,
      },

      data: {
        ativo,
      },

      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        ativo: true,
      },
    });
  }

  async remove(
    id: number,
    empresaId: number,
  ) {
    return this.updateStatus(
      id,
      false,
      empresaId,
    );
  }
}