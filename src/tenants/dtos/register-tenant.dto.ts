import { IsString, IsEmail, IsNotEmpty, IsEnum, Length } from 'class-validator';
import { PlanSuscripcion } from '../../shared/enums/subscription-plan.enum';

export class RegisterTenantDto {
  // --- DATOS DE LA ESCUELA ---
  @IsString()
  @IsNotEmpty()
  nombreEscuela: string;

  @IsString()
  @IsNotEmpty()
  dominioEscuela: string; // ej: "mi-escuela.com"

  @IsEnum(PlanSuscripcion)
  plan: PlanSuscripcion;

  // --- DATOS DEL DUEÑO (ADMIN) ---
  @IsString()
  @IsNotEmpty()
  nombreAdmin: string;

  @IsEmail()
  emailAdmin: string;

  @IsString()
  @Length(6, 20)
  passwordAdmin: string;

  // --- DATOS DE PAGO (SIMPLIFICADO) ---
  @IsString()
  nombreTitular: string;

  @IsString()
  @Length(4, 4)
  tarjetaUltimos4: string; // "4242"

  @IsString()
  tokenPago: string; // El token que te da Stripe/Openpay
}