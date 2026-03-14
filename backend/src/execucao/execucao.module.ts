import { Module } from '@nestjs/common';
import { ExecucaoService } from './execucao.service';
import { ExecucaoController } from './execucao.controller';

@Module({
  providers: [ExecucaoService],
  controllers: [ExecucaoController]
})
export class ExecucaoModule {}
