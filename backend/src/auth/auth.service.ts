import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(
    data: RegisterDto,
  ) {
    const email =
      data.email
        .trim()
        .toLowerCase();

    const senhaHash =
      await bcrypt.hash(
        data.senha,
        12,
      );

    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const empresa =
            await tx.empresa.create({
              data: {
                nome:
                  data.nomeEmpresa.trim(),
              },
            });

          const usuario =
            await tx.usuario.create({
              data: {
                nome:
                  data.nome.trim(),

                email,

                senhaHash,

                perfil: 'ADMIN',

                empresaId:
                  empresa.id,
              },
            });

          return {
            empresa: {
              id: empresa.id,
              nome: empresa.nome,
            },

            usuario: {
              id: usuario.id,
              nome: usuario.nome,
              email: usuario.email,
              perfil: usuario.perfil,
              ativo: usuario.ativo,
              empresaId:
                usuario.empresaId,
            },
          };
        },
      );
    } catch (error) {
      const prismaError =
        error as {
          code?: string;
        };

      if (
        prismaError.code ===
        'P2002'
      ) {
        throw new BadRequestException(
          'E-mail já cadastrado',
        );
      }

      throw error;
    }
  }

  async login(
    data: LoginDto,
  ) {
    const email =
      data.email
        .trim()
        .toLowerCase();

    const usuario =
      await this.prisma.usuario.findUnique(
        {
          where: {
            email,
          },
        },
      );

    if (
      !usuario ||
      !usuario.ativo
    ) {
      throw new UnauthorizedException(
        'Credenciais inválidas',
      );
    }

    const senhaValida =
      await bcrypt.compare(
        data.senha,
        usuario.senhaHash,
      );

    if (!senhaValida) {
      throw new UnauthorizedException(
        'Credenciais inválidas',
      );
    }

    const payload = {
      sub: usuario.id,
      empresaId:
        usuario.empresaId,
      perfil:
        usuario.perfil,
    };

    const accessToken =
      await this.jwtService.signAsync(
        payload,
      );

    return {
      access_token: accessToken,

      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        empresaId:
          usuario.empresaId,
      },
    };
  }
}