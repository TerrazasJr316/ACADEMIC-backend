import { IsString, IsNotEmpty } from 'class-validator';

export class SendMessageDto {
  @IsNotEmpty()
  @IsString()
  destinatario: string; // Ejemplo: "Todos", "Docentes", "Alumnos"

  @IsNotEmpty()
  @IsString()
  asunto: string;

  @IsNotEmpty()
  @IsString()
  cuerpo: string;
}