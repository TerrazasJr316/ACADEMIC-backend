import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class CreateGroupDto {
  @IsOptional()
  id?: string; // Si viene ID, es edición

  @IsNotEmpty()
  @IsString()
  nombre: string; // Ej: "3A" (Grado + Letra combinados o separados, tu front manda "3A")

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(60)
  limiteAlumnos: number; // Tu front lo llama "alumnos" (capacidad) pero la BD es "limite_alumnos"

  @IsOptional()
  @IsNumber()
  semestre?: number; // Tu front manda "grado" (1, 2, 3...)

  @IsOptional()
  @IsString()
  turno?: string; // Matutino/Vespertino
}