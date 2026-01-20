import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class CreateGroupDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsNotEmpty()
  @IsString()
  nombre: string; 

  @IsOptional() // 👈 Cambiado a opcional para que no de error 400 si el front no lo manda
  @IsNumber()
  limiteAlumnos?: number; 

  @IsOptional()
  @IsNumber()
  semestre?: number; 

  @IsOptional()
  @IsString()
  turno?: string;
}