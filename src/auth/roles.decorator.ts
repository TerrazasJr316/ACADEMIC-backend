import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../shared/enums/user-role.enum'; // Asegúrate de tener tu Enum a la mano

// Esta es la clave secreta para leer los roles
export class RolesKey {
  static readonly KEY = 'roles';
}

// Este es el "Pegamento" que pone el rol en la ruta
// Ejemplo de uso: @Roles(UserRole.ADMIN)
export const Roles = (...roles: UserRole[]) => SetMetadata(RolesKey.KEY, roles);