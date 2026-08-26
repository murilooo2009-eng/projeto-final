import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

import {
  PeriodicidadeDto,
} from './create-checklist.dto';

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

  @IsOptional()
  @Matches(
    /^([01]\d|2[0-3]):[0-5]\d$/,
  )
  horarioDisponivelInicio?: string;

  @IsOptional()
  @Matches(
    /^([01]\d|2[0-3]):[0-5]\d$/,
  )
  horarioDisponivelFim?: string;
}