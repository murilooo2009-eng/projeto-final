import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';

import { ChecklistService } from './checklist.service';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

import { CreateChecklistDto } from './dto/create-checklist.dto';
import { UpdateChecklistDto } from './dto/update-checklist.dto';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@Controller('checklists')
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
)
export class ChecklistController {
  constructor(
    private readonly service: ChecklistService,
  ) {}

  @Get()
  findAll(
    @Request() req,
  ) {
    return this.service.findAll(
      req.user.id,
      req.user.empresaId,
    );
  }

  @Get(':id')
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
      req.user.id,
      req.user.empresaId,
    );
  }

  @Post()
  @Roles('ADMIN')
  create(
    @Body()
    dto: CreateChecklistDto,

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
    dto: UpdateChecklistDto,

    @Request() req,
  ) {
    return this.service.update(
      id,
      dto,
      req.user.empresaId,
    );
  }

  @Post(':id/itens')
  @Roles('ADMIN')
  createItem(
    @Param(
      'id',
      ParseIntPipe,
    )
    id: number,

    @Body()
    dto: CreateItemDto,

    @Request() req,
  ) {
    return this.service.createItem(
      id,
      dto,
      req.user.empresaId,
    );
  }

  @Put(':id/itens/:idItem')
  @Roles('ADMIN')
  updateItem(
    @Param(
      'id',
      ParseIntPipe,
    )
    id: number,

    @Param(
      'idItem',
      ParseIntPipe,
    )
    idItem: number,

    @Body()
    dto: UpdateItemDto,

    @Request() req,
  ) {
    return this.service.updateItem(
      id,
      idItem,
      dto,
      req.user.empresaId,
    );
  }

  @Delete(':id/itens/:idItem')
  @Roles('ADMIN')
  removeItem(
    @Param(
      'id',
      ParseIntPipe,
    )
    id: number,

    @Param(
      'idItem',
      ParseIntPipe,
    )
    idItem: number,

    @Request() req,
  ) {
    return this.service.removeItem(
      id,
      idItem,
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