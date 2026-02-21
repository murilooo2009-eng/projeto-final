import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { EmpresaModule } from './empresa/empresa.module';
import { UsuarioModule } from './usuario/usuario.module';
import { ChecklistModule } from './checklist/checklist.module';
import { ExecucaoModule } from './execucao/execucao.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    AuthModule,
    PrismaModule,
    UsuarioModule,
    EmpresaModule,
    ChecklistModule,
    ExecucaoModule,
  ],
})
export class AppModule {}