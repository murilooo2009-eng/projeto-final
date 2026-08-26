import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import { ExecucaoService, UsuarioExecucao } from './execucao.service';
import { AtualizarItemDto } from './dto/atualizar-item.dto';
import { ListarExecucoesQueryDto } from './dto/listar-execucoes-query.dto';

@Controller('execucoes')
@UseGuards(JwtAuthGuard)
export class ExecucaoController {
  constructor(private readonly service: ExecucaoService) {}

  private extrairUsuario(req): UsuarioExecucao {
    return {
      id: req.user.id,
      empresaId: req.user.empresaId,
      perfil: req.user.perfil,
    };
  }

  @Post('checklists/:checklistId')
  iniciar(
    @Param('checklistId', ParseIntPipe) checklistId: number,
    @Request() req,
  ) {
    return this.service.criar(this.extrairUsuario(req), { checklistId });
  }

  @Get('em-andamento')
  listarEmAndamento(@Request() req) {
    return this.service.listarEmAndamento(this.extrairUsuario(req));
  }

  @Get()
  findAll(@Query() query: ListarExecucoesQueryDto, @Request() req) {
    return this.service.listar(this.extrairUsuario(req), query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.service.buscarPorId(this.extrairUsuario(req), id);
  }

  @Get(':id/progresso')
  progresso(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.service.progresso(this.extrairUsuario(req), id);
  }

  @Patch(':id/itens/:itemId')
  atualizarItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: AtualizarItemDto,
    @Request() req,
  ) {
    return this.service.atualizarItem(this.extrairUsuario(req), id, itemId, dto);
  }

  @Post(':id/finalizar')
  finalizar(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.service.finalizar(this.extrairUsuario(req), id);
  }

  @Post(':id/cancelar')
  cancelar(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.service.cancelar(this.extrairUsuario(req), id);
  }
}
