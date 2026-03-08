import { Injectable, UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
   private prisma: PrismaService,
  private jwtService: JwtService
) {}

async register(data: RegisterDto) {

  const email = data.email.trim().toLowerCase();

  const senhaHash = await bcrypt.hash(data.senha, 10);

  try {

    return await this.prisma.$transaction(async (tx) => {

      const empresa = await tx.empresa.create({
        data: {
          nome: data.nomeEmpresa
        }
      });

      const usuario = await tx.usuario.create({
        data: {
          nome: data.nome,
          email: email,
          senhaHash,
          empresaId: empresa.id
        }
      });

      return {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        access_token: this.jwtService.sign({
          sub: usuario.id,
          empresaId: usuario.empresaId
        })
      };
    });

  } catch (error) {

    if (error?.code === 'P2002') {
      throw new BadRequestException('Email já cadastrado');
    }

    throw error;
  }
}

async login(data: LoginDto) {

  const email = data.email.toLowerCase();

  const usuario = await this.prisma.usuario.findUnique({
    where: { email },
    select: {
    id: true,
    email: true,
    senhaHash: true,
    empresaId: true,
    nome: true
  }
  });

  if (!usuario) {
    throw new UnauthorizedException('Credenciais inválidas');
  }

  const senhaValida = await bcrypt.compare(data.senha, usuario.senhaHash);

  if (!senhaValida) {
    throw new UnauthorizedException('Credenciais inválidas');
  }

  const payload = {
    sub: usuario.id,
    empresaId: usuario.empresaId
  };

  return {
    access_token: this.jwtService.sign(payload)
  };
}
}