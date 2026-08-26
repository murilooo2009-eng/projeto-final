import { IsBoolean } from 'class-validator';

export class UpdateStatusDto {
  @IsBoolean({ message: 'O campo ativo deve ser booleano.' })
  ativo!: boolean;
}
