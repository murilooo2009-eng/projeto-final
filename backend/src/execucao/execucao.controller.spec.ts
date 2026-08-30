import { Test, TestingModule } from '@nestjs/testing';
import { ExecucaoController } from './execucao.controller';
import { ExecucaoService } from './execucao.service';
import { describe, beforeEach, it, expect } from '@jest/globals';

describe('ExecucaoController', () => {
  let controller: ExecucaoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExecucaoController],
      providers: [{
        provide: ExecucaoService,
        useValue: {
          criar: () => {}, listar: () => {}, listarEmAndamento: () => {}, buscarPorId: () => {},
          progresso: () => {}, atualizarItem: () => {}, finalizar: () => {}, cancelar: () => {},
        },
      }],
    }).compile();

    controller = module.get<ExecucaoController>(ExecucaoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
