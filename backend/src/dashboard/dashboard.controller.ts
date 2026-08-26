import { Controller, Get, Request, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

import { DashboardService, DashboardUsuario } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  private extrairUsuario(req): DashboardUsuario {
    return {
      id: req.user.id,
      empresaId: req.user.empresaId,
      perfil: req.user.perfil,
    };
  }

  @Get()
  obter(@Request() req) {
    return this.service.obterDashboard(this.extrairUsuario(req));
  }

  @Get('admin')
  @Roles('ADMIN')
  admin(@Request() req) {
    return this.service.obterDashboardAdmin(this.extrairUsuario(req));
  }

  @Get('colaborador')
  @Roles('COLABORADOR')
  colaborador(@Request() req) {
    return this.service.obterDashboardColaborador(this.extrairUsuario(req));
  }
}
