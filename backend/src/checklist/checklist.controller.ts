import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';

import { ChecklistService } from './checklist.service';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { UpdateChecklistDto } from './dto/update-checklist.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { Roles } from 'src/auth/roles.decorator';

@Controller('checklists')
@UseGuards(JwtAuthGuard)
export class ChecklistController {

  constructor(private service: ChecklistService) {}

  @Roles('GERENTE')
  @Post()
  create(
    @Body() dto: CreateChecklistDto,
    @Request() req,
  ) {
    return this.service.create(dto, req.user.id);
  }

  @Roles('GERENTE')
  @Post(':id/itens')
createItem(
  @Param('id', ParseIntPipe) id: number,
  @Body() dto: CreateItemDto,
  @Request() req
) {
  return this.service.createItem(
    Number(id),
    dto,
    req.user.id
  );
}

  @Get()
  findAll(@Request() req) {
    return this.service.findAll(req.user.id);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ) {
    return this.service.findOne(Number(id), req.user.id);
  }

  @Roles('GERENTE')
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateChecklistDto,
    @Request() req,
  ) {
    return this.service.update(Number(id), dto, req.user.id);
  }

  @Roles('GERENTE')
  @Put(':id/itens/:idItem')
  updateItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('idItem', ParseIntPipe) idItem: number,
    @Body() dto: UpdateItemDto,
    @Request() req,
  ) {
    return this.service.updateItem(Number(id), Number(idItem), dto, req.user.id);
  }

  @Roles('GERENTE')
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ) {
    return this.service.remove(Number(id), req.user.id);
  }

  @Roles('GERENTE')
  @Delete(':id/itens/:idItem')
  removeItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('idItem', ParseIntPipe) idItem: number,
    @Request() req,
  ) {
    return this.service.removeItem(Number(id), Number(idItem), req.user.id);
  }

}