import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterDto {

  @IsNotEmpty({ message: 'Nome é obrigatório' })
  nome: string;

  @IsNotEmpty({ message: 'Email é obrigatório' })
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  senha: string;

  @IsNotEmpty({ message: 'Nome da empresa é obrigatório' })
  nomeEmpresa: string;
}