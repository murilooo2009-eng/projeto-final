import { Controller, Get, Request } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {

    constructor(private service: DashboardService) {}

    @Get()
getDashboard(@Request() req) {
 return this.service.getDashboard(
   req.user.empresaId
 );
}
}
