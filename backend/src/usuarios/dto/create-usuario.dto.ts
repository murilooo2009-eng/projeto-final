import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength
} from 'class-validator';

export enum RoleDto {
  FUNCIONARIO = 'FUNCIONARIO',
  GERENTE = 'GERENTE'
}

export class CreateUsuarioDto {

  @IsNotEmpty()
  @IsString()
  nome!: string;

  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @MinLength(6)
  senha!: string;

  @IsOptional()
  @IsEnum(RoleDto, { message: 'Cargo deve ser FUNCIONARIO ou GERENTE' })
  cargo?: RoleDto;
}