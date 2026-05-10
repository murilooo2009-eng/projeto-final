import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { IsEnum } from 'class-validator';

export enum PeriodicidadeDto {
  DIARIO = 'DIARIO',
  SEMANAL = 'SEMANAL'
}

export class CreateChecklistDto {

  @IsNotEmpty()
  @IsString()
  titulo!: string;

  @IsOptional()
  @IsEnum(PeriodicidadeDto)
  periodicidade?: PeriodicidadeDto;

}