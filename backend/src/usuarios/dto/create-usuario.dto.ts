import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

import { Perfil } from '@prisma/client';

export class CreateUsuarioDto {
  @IsNotEmpty()
  @IsString()
  nome!: string;

  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsOptional()
  @MinLength(8)
  senha?: string;

  @IsOptional()
  @IsEnum(Perfil)
  perfil?: Perfil;
}