import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {

    constructor(private service: DashboardService) {}

    @Get()
getDashboard(@Request() req) {
 return this.service.getDashboard(
   req.user.empresaId
 );
}
}
