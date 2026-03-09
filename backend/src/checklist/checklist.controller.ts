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
} from '@nestjs/common';

import { ChecklistService } from './checklist.service';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { UpdateChecklistDto } from './dto/update-checklist.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@Controller('checklists')
@UseGuards(JwtAuthGuard)
export class ChecklistController {

  constructor(private service: ChecklistService) {}

  @Post()
  create(
    @Body() dto: CreateChecklistDto,
    @Request() req,
  ) {
    return this.service.create(dto, req.user.id);
  }

  @Post(':id/itens')
createItem(
  @Param('id') id: string,
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
    @Param('id') id: string,
    @Request() req,
  ) {
    return this.service.findOne(Number(id), req.user.id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateChecklistDto,
    @Request() req,
  ) {
    return this.service.update(Number(id), dto, req.user.id);
  }

  @Put(':id/itens/:idItem')
  updateItem(
    @Param('id') id: string,
    @Param('idItem') idItem: string,
    @Body() dto: UpdateItemDto,
    @Request() req,
  ) {
    return this.service.updateItem(Number(id), Number(idItem), dto, req.user.id);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Request() req,
  ) {
    return this.service.remove(Number(id), req.user.id);
  }

  @Delete(':id/itens/:idItem')
  removeItem(
    @Param('id') id: string,
    @Param('idItem') idItem: string,
    @Request() req,
  ) {
    return this.service.removeItem(Number(id), Number(idItem), req.user.id);
  }

}