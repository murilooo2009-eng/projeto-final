import { Body, Controller, Delete, Param, ParseIntPipe, Post, Request, UseGuards } from '@nestjs/common';
import { Roles } from 'src/auth/roles.decorator';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UsuariosService } from './usuarios.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('usuarios')
@UseGuards(JwtAuthGuard)
export class UsuariosController {

    constructor(private service: UsuariosService) {}

@Post()
@Roles('GERENTE')
create(
 @Body() dto: CreateUsuarioDto,
 @Request() req
) {
 return this.service.create(
   dto,
   req.user.empresaId
 );
}

@Roles('GERENTE')
@Delete(':id')
remove(
    @Param('id', ParseIntPipe) id:number,
    @Request() req
) {
    return this.service.remove(Number(id), req.user.empresaId);
}
}