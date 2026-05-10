import {
  IsArray,
  IsInt,
  IsBoolean,
  ValidateNested
} from 'class-validator';

import { Type } from 'class-transformer';

export class CreateExecucaoItemDto {
  @IsInt()
  itemId!: number;

  @IsBoolean()
  concluido!: boolean;
}

export class CreateExecucaoDto {
  @IsInt()
  checklistId!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateExecucaoItemDto)
  itens!: CreateExecucaoItemDto[];
}