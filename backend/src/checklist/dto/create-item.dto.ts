import { IsString, IsInt, IsOptional, IsBoolean, IsNotEmpty } from 'class-validator';

export class CreateItemDto {
  @IsNotEmpty()
  @IsString()
  descricao: string;

  @IsOptional()
  @IsInt()
  ordem?: number;

  @IsOptional()
  @IsBoolean()
  obrigatorio?: boolean;

}