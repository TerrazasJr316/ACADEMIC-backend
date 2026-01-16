import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class GenerateReportDto {
  @IsNotEmpty()
  @IsString()
  periodo: string; // ID del Periodo (Ciclo Escolar)

  @IsNotEmpty()
  @IsString()
  asignatura: string; // ID de la Materia (Subject)

  @IsNotEmpty()
  @IsString()
  grupo: string; // ID del Grupo

  @IsOptional()
  @IsString()
  matricula?: string; // Opcional: Matrícula del alumno
}