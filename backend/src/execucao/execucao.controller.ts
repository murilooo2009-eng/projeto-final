import { Controller, Post, Body, Request, UseGuards } from '@nestjs/common';
import { ExecucaoService } from './execucao.service';
import { CreateExecucaoDto } from './dto/create-execucao.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Param, Get } from '@nestjs/common';

@Controller('execucoes')
@UseGuards(JwtAuthGuard)
export class ExecucaoController {

  constructor(private service: ExecucaoService) {}

  @Post()
  executar(
    @Body() dto: CreateExecucaoDto,
    @Request() req
  ) {
    return this.service.executar(dto, req.user.id);
  }

  @Get()
findAll(@Request() req) {
  return this.service.findAll(req.user.id);
}

@Get(':id')
findOne(
  @Param('id') id: string,
  @Request() req
) {
  return this.service.findOne(Number(id), req.user.id);
}

}
