import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';

export enum PeriodicidadeDto {
  DIARIO = 'DIARIO',
  SEMANAL = 'SEMANAL'
}

export class UpdateChecklistDto {

  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsEnum(PeriodicidadeDto)
  periodicidade?: PeriodicidadeDto;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

}