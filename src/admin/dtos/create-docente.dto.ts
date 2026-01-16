import { IsString, IsNotEmpty, IsEmail, IsOptional } from 'class-validator';

export class CreateDocenteDto {
  @IsNotEmpty() @IsString() nombre: string;
  @IsNotEmpty() @IsEmail() email: string;
  @IsNotEmpty() @IsString() clave: string;
  @IsOptional() @IsString() telefono?: string;
  @IsOptional() @IsString() especialidad?: string;
}