import { IsArray, IsInt, IsBoolean } from 'class-validator';

export class CreateExecucaoItemDto {

  @IsInt()
  itemId: number;

  @IsBoolean()
  concluido: boolean;

}

export class CreateExecucaoDto {

  @IsInt()
  checklistId: number;

  @IsArray()
  itens: CreateExecucaoItemDto[];

}
