import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateChecklistDto {

  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsString()
  periodicidade?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

}