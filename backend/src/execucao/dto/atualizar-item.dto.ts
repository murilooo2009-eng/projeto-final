import { IsBoolean } from 'class-validator';

export class AtualizarItemDto {
  @IsBoolean({ message: 'O campo concluido deve ser booleano.' })
  concluido!: boolean;
}
