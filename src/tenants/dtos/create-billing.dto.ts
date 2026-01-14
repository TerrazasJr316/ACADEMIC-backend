import { IsString, IsNotEmpty, Length, IsDateString, IsUUID } from 'class-validator';

export class CreateBillingDto {
  @IsUUID()
  schoolId: string; // Necesitas el ID para saber a quién vincularlo

  @IsString()
  @IsNotEmpty()
  nombreTitular: string;

  @IsString()
  @Length(4, 4)
  ultimosDigitosTarjeta: string;

  @IsString()
  @IsNotEmpty()
  tokenPago: string;

  @IsDateString()
  fechaVencimiento: string; // Formato YYYY-MM-DD

  @IsString()
  direccionFiscal: string;
}