import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesKey } from './roles.decorator';
import { UserRole } from '../shared/enums/user-role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {} // El Reflector es quien "lee" los letreros

  canActivate(context: ExecutionContext): boolean {
    // 1. Leemos qué roles pide la ruta (el letrero)
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(RolesKey.KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si la ruta no tiene letrero, ¡pasa cualquiera!
    if (!requiredRoles) {
      return true;
    }

    // 2. Obtenemos al usuario (que el JwtStrategy ya validó antes)
    const { user } = context.switchToHttp().getRequest();

    // 3. Verificamos si el usuario tiene el rol necesario
    const tienePermiso = requiredRoles.some((role) => user.rol === role);

    if (!tienePermiso) {
      throw new ForbiddenException('⛔ No tienes permisos para estar aquí (Role insuficiente)');
    }

    return true;
  }
}