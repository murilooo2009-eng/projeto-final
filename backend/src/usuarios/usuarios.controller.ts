import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

import { UsuariosService } from './usuarios.service';

import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@Controller('usuarios')
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
)
export class UsuariosController {
  constructor(
    private readonly service: UsuariosService,
  ) {}

  @Get()
  @Roles('ADMIN')
  findAll(
    @Request() req,
  ) {
    return this.service.findAll(
      req.user.empresaId,
    );
  }

  @Get(':id')
  @Roles('ADMIN')
  findOne(
    @Param(
      'id',
      ParseIntPipe,
    )
    id: number,

    @Request() req,
  ) {
    return this.service.findOne(
      id,
      req.user.empresaId,
    );
  }

  @Post()
  @Roles('ADMIN')
  create(
    @Body()
    dto: CreateUsuarioDto,

    @Request() req,
  ) {
    return this.service.create(
      dto,
      req.user.empresaId,
    );
  }

  @Put(':id')
  @Roles('ADMIN')
  update(
    @Param(
      'id',
      ParseIntPipe,
    )
    id: number,

    @Body()
    dto: CreateUsuarioDto,

    @Request() req,
  ) {
    return this.service.update(
      id,
      dto,
      req.user.empresaId,
    );
  }

  @Patch(':id/status')
  @Roles('ADMIN')
  updateStatus(
    @Param(
      'id',
      ParseIntPipe,
    )
    id: number,

    @Body()
    body: UpdateStatusDto,

    @Request() req,
  ) {
    return this.service.updateStatus(
      id,
      body.ativo,
      req.user.empresaId,
    );
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(
    @Param(
      'id',
      ParseIntPipe,
    )
    id: number,

    @Request() req,
  ) {
    return this.service.remove(
      id,
      req.user.empresaId,
    );
  }
}