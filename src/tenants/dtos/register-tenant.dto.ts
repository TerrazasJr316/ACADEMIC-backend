import { IsEmail, IsNotEmpty, IsString, IsOptional, IsEnum, MinLength } from 'class-validator';

// Asegúrate de que el Enum coincida con el que usas en tu entity
export enum PlanType {
  BASIC = 'BASIC',
  PRO = 'PRO',
}

export class RegisterTenantDto {
  @IsNotEmpty()
  @IsString()
  nombreEscuela: string;

  @IsNotEmpty()
  @IsString()
  dominioEscuela: string;

  @IsEmail()
  @IsNotEmpty()
  emailAdmin: string;

  // El nombre puede ser opcional si el form básico no lo pide, 
  // pero la contraseña AHORA ES OBLIGATORIA SIEMPRE.
  @IsOptional() 
  nombreAdmin?: string;

  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  passwordAdmin: string;

  @IsNotEmpty()
  @IsEnum(PlanType)
  plan: PlanType; 

  // --- CAMPOS DE PAGO (Siguen siendo opcionales para BASIC) ---
  @IsOptional()
  @IsString()
  tokenPago?: string;

  @IsOptional()
  @IsString()
  tarjetaUltimos4?: string;
  
  @IsOptional()
  @IsString()
  nombreTitular?: string;
}