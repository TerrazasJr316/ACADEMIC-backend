// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AuthService {
  // Lista centralizada de usuarios para todo el equipo
  private users = [
    { 
      id: 'a1', 
      nombre: 'Admin Maria', 
      email: 'adminmaria@tesji.com', 
      rol: 'ADMIN', 
      tenantId: 'T-123' 
    },
    { 
      id: 'd1', 
      nombre: 'Rodolfo Docente', 
      email: 'drodolfo@tesji.com', 
      rol: 'DOCENTE', 
      tenantId: 'T-123' 
    },
    { 
      id: 'l1', 
      nombre: 'Laura Alumna', 
      email: 'a12345678@tesji.com', 
      rol: 'ALUMNO', 
      tenantId: 'T-123' 
    },
  ];

  async validateUser(email: string, pass: string, schoolKey: string) {
    // 1. Buscar al usuario por email (sin importar mayúsculas)
    const user = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());

    // 2. Extraer el dominio del correo para validar la escuela (SaaS Key)
    const emailDomainPart = email.split('@')[1]?.split('.')[0];
    
    // 3. Validación de seguridad básica
    if (!user || emailDomainPart !== schoolKey) {
      throw new UnauthorizedException('Credenciales inválidas o clave de escuela incorrecta');
    }

    // Si todo es correcto, regresamos los datos del usuario
    console.log(`✅ Login exitoso para: ${user.nombre} (${user.rol})`);
    return user;
  }
}