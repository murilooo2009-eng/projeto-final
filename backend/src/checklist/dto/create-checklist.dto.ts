import { IsString, IsOptional } from 'class-validator';

export class CreateChecklistDto {

  @IsString()
  titulo: string;

  @IsOptional()
  @IsString()
  periodicidade?: string;

}