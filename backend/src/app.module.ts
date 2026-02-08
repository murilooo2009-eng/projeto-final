import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { EmpresaModule } from './empresa/empresa.module';
import { UsuarioModule } from './usuario/usuario.module';
import { ChecklistModule } from './checklist/checklist.module';
import { ExecucaoModule } from './execucao/execucao.module';

@Module({
  imports: [AuthModule, EmpresaModule, UsuarioModule, ChecklistModule, ExecucaoModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
