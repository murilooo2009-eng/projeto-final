import { Module } from '@nestjs/common';
import { ExecucaoService } from './execucao.service';
import { ExecucaoController } from './execucao.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ExecucaoService],
  controllers: [ExecucaoController],
})
export class ExecucaoModule {}
