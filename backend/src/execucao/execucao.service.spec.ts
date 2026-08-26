import { Test, TestingModule } from '@nestjs/testing';
import { ExecucaoService } from './execucao.service';
import { describe, beforeEach, it } from '@jest/globals';
import { expect } from '@jest/globals';

describe('ExecucaoService', () => {
  let service: ExecucaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExecucaoService],
    }).compile();

    service = module.get<ExecucaoService>(ExecucaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
