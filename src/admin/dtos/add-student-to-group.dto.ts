import { IsString, IsNotEmpty } from 'class-validator';

export class AddStudentDto {
  @IsNotEmpty()
  @IsString()
  matricula: string;

  @IsNotEmpty()
  @IsString()
  nombreCompleto: string; // Se recibe, aunque en tu BD usemos el email para identificarlo

  @IsNotEmpty()
  @IsString()
  grupoId: string; // El UUID del grupo real
}