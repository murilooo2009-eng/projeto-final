import { Test, TestingModule } from '@nestjs/testing';
import { ChecklistController } from './checklist.controller';
import { ChecklistService } from './checklist.service';
import { describe, beforeEach, it, expect } from '@jest/globals';

describe('ChecklistController', () => {
  let controller: ChecklistController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChecklistController],
      providers: [{
        provide: ChecklistService,
        useValue: {
          create: () => {}, findAll: () => {}, findOne: () => {}, update: () => {},
          remove: () => {}, createItem: () => {}, updateItem: () => {}, removeItem: () => {},
        },
      }],
    }).compile();

    controller = module.get<ChecklistController>(ChecklistController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
