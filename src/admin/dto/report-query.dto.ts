import { IsString, IsOptional } from 'class-validator';

export class ReportQueryDto {
  @IsString()
  periodo: string; // Ej: "Enero - Junio 2024"

  @IsString()
  asignaturaId: string; // El ID de la materia seleccionada

  @IsString()
  groupId: string; // El ID del grupo (ej: 3A)

  @IsOptional()
  @IsString()
  alumnoMatricula?: string; // El campo opcional de matrícula
}