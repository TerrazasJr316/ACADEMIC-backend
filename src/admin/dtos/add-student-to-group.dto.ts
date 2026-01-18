import { IsString, IsNotEmpty } from 'class-validator';

export class AddStudentDto {
  @IsNotEmpty()
  @IsString()
  matricula: string;

  @IsNotEmpty()
  @IsString()
  nombre: string; // Sincronizado con tu adminService.registrarAlumno

  @IsNotEmpty()
  @IsString()
  grupoId: string;
}