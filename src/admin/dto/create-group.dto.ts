import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

export class CreateGroupDto {
  @IsNotEmpty()
  @IsString()
  grado: string; // Ejemplo: "1", "2", "3"

  @IsNotEmpty()
  @IsString()
  letra: string; // Ejemplo: "A", "B", "C"

  @IsNumber()
  numeroAlumnos: number;

  @IsNotEmpty()
  @IsString()
  turno: 'Matutino' | 'Vespertino'; // Ejemplo: "Matutino" o "Vespertino"
}