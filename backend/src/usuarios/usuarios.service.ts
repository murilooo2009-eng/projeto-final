import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuariosService {
 constructor(private readonly prisma: PrismaService) {}

 async create(
  dto: CreateUsuarioDto,
  empresaId: number
 ) {

 const senhaHash =
   await bcrypt.hash(dto.senha, 10);

 return this.prisma.usuario.create({
   data: {
     nome: dto.nome,
     email: dto.email,
     senhaHash,
     cargo: dto.cargo ?? 'FUNCIONARIO',
     empresaId
   }
 });
}

async findOne(id: number, empresaId: number) {
  const usuario = await this.prisma.usuario.findFirst({
    where: {
      id,
      empresaId
    }
  });

  if (!usuario) {
    throw new NotFoundException('Usuário não encontrado');
  }

  return usuario;
}

async remove(
    id: number,
    empresaId: number
) {
    await this.findOne(id, empresaId);

    return this.prisma.usuario.delete({
        where: { id }
    });
}
}