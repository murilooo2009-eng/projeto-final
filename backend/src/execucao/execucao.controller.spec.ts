import { Test, TestingModule } from '@nestjs/testing';
import { ExecucaoController } from './execucao.controller';
import { describe, beforeEach, it } from 'node:test';
import { expect } from '@jest/globals';

describe('ExecucaoController', () => {
  let controller: ExecucaoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExecucaoController],
    }).compile();

    controller = module.get<ExecucaoController>(ExecucaoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
