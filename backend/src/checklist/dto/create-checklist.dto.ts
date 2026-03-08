import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateChecklistDto {

  @IsNotEmpty()
  @IsString()
  titulo: string;

  @IsOptional()
  @IsString()
  periodicidade?: string;

}