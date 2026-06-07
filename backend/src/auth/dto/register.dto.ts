import { IsEmail, IsEnum, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export enum RoleDto {
  FUNCIONARIO = 'FUNCIONARIO',
  GERENTE = 'GERENTE'
}

export class RegisterDto {

  @IsNotEmpty({ message: 'Nome é obrigatório' })
  nome!: string;

  @IsNotEmpty({ message: 'Email é obrigatório' })
  @IsEmail({}, { message: 'Email inválido' })
  email!: string;

  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  senha!: string;

  @IsNotEmpty({ message: 'Nome da empresa é obrigatório' })
  nomeEmpresa!: string;

  @IsEnum(RoleDto, { message: 'Cargo deve ser FUNCIONARIO ou GERENTE' })
  @IsOptional()
  cargo?: RoleDto;
}