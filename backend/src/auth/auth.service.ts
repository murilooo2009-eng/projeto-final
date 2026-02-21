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

  const usuarioExistente = await this.prisma.usuario.findUnique({
    where: { email: data.email }
  });

  if (usuarioExistente) {
    throw new BadRequestException('Email já cadastrado');
  }

  const senhaHash = await bcrypt.hash(data.senha, 10);

  const empresa = await this.prisma.empresa.create({
    data: {
      nome: `${data.nome} Empresa`
    }
  });

  const usuario = await this.prisma.usuario.create({
    data: {
      nome: data.nome,
      email: data.email,
      senhaHash: senhaHash,
      empresaId: empresa.id
    }
  });

  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email
  };
}

async login(email: string, senha: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email },
    });

    if (!usuario) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    const senhaValida = await bcrypt.compare(
      senha,
      usuario.senhaHash,
    );

    if (!senhaValida) {
      throw new UnauthorizedException('Senha inválida');
    }

    const payload = {
      sub: usuario.id,
      email: usuario.email,
      empresaId: usuario.empresaId,
    };

    return {
      token: this.jwtService.sign(payload),
    };
  }
}