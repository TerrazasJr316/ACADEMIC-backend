import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesKey } from './roles.decorator';
import { UserRole } from '../shared/enums/user-role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {} 

  canActivate(context: ExecutionContext): boolean {
    // 1. Leemos qué roles pide la ruta
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(RolesKey.KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si la ruta no tiene letrero de roles, pasa cualquiera
    if (!requiredRoles) {
      return true;
    }

    // 2. Obtenemos al usuario (que JwtStrategy ya validó)
    const { user } = context.switchToHttp().getRequest();

    // VALIDACIÓN EXTRA: Si por alguna razón el usuario no llegó bien
    if (!user || !user.rol) {
        throw new UnauthorizedException('Usuario no identificado o rol no encontrado en el token.');
    }

    // 3. COMPARACIÓN FLEXIBLE (LA SOLUCIÓN MÁGICA) 🛡️
    // Convertimos ambos lados a MAYÚSCULAS para evitar errores de tipeo en la BD
    const tienePermiso = requiredRoles.some((role) => 
        user.rol.toUpperCase() === role.toString().toUpperCase()
    );

    if (!tienePermiso) {
      console.log(`⛔ Bloqueo de Rol: Usuario tiene [${user.rol}] pero se requiere [${requiredRoles}]`);
      throw new ForbiddenException('⛔ No tienes permisos para estar aquí (Role insuficiente)');
    }

    return true;
  }
}