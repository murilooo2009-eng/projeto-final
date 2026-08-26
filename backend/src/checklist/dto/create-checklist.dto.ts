import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export enum PeriodicidadeDto {
  DIARIO = 'DIARIO',
  SEMANAL = 'SEMANAL',
}

export class CreateChecklistDto {
  @IsNotEmpty()
  @IsString()
  titulo!: string;

  @IsEnum(PeriodicidadeDto)
  periodicidade!: PeriodicidadeDto;

  @IsOptional()
  @Matches(
    /^([01]\d|2[0-3]):[0-5]\d$/,
    {
      message:
        'Horário deve estar no formato HH:mm',
    },
  )
  horarioDisponivelInicio?: string;

  @IsOptional()
  @Matches(
    /^([01]\d|2[0-3]):[0-5]\d$/,
    {
      message:
        'Horário deve estar no formato HH:mm',
    },
  )
  horarioDisponivelFim?: string;
}