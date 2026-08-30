import { Test, TestingModule } from '@nestjs/testing';
import { UsuariosController } from './usuarios.controller';
import { UsuariosService } from './usuarios.service';
import { describe, beforeEach, it, expect } from '@jest/globals';

describe('UsuariosController', () => {
  let controller: UsuariosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsuariosController],
      providers: [{
        provide: UsuariosService,
        useValue: {
          create: () => {}, findAll: () => {}, findOne: () => {},
          update: () => {}, updateStatus: () => {}, remove: () => {},
        },
      }],
    }).compile();

    controller = module.get<UsuariosController>(UsuariosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
