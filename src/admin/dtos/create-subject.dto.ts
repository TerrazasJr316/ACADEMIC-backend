import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateSubjectDto {
  @IsNotEmpty()
  @IsString()
  materia: string; // Nombre de la materia

  @IsNotEmpty()
  @IsString()
  codigo: string; // Código de la materia

  @IsOptional()
  @IsNumber()
  creditos?: number; // Opcional, pondremos default en el servicio
}