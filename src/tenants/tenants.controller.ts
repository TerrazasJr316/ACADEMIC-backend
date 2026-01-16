import { Controller, Post, Body, Get, UseGuards, Request, Param } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { RegisterTenantDto } from './dtos/register-tenant.dto';
import { AuthGuard } from '@nestjs/passport'; // Guardia de Autenticación (¿Quién eres?)
import { RolesGuard } from '../auth/roles.guard'; // Guardia de Autorización (¿Tienes permiso?)
import { Roles } from '../auth/roles.decorator'; // El "Letrero" para definir roles permitidos
import { UserRole } from '../shared/enums/user-role.enum'; // Tu lista de roles (ADMIN, DOCENTE, etc.)

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  // 1. RUTA PÚBLICA: Registro de Escuela
  // Cualquiera puede entrar aquí para crear su cuenta
  @Post('register')
  create(@Body() registerDto: RegisterTenantDto) {
    return this.tenantsService.registerSchool(registerDto);
  }

  // 2. RUTA PROTEGIDA (Nivel 1): Solo Login
  // Requiere tener un Token válido, sin importar el rol
  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Request() req) {
    return {
      mensaje: '¡Entraste a la zona VIP (Login exitoso)!',
      datos_del_usuario: req.user
    };
  }

  // 3. RUTA BLINDADA (Nivel 2): Login + Rol de ADMIN
  // Solo pasa si tienes Token Y tu rol es 'ADMIN'
  @UseGuards(AuthGuard('jwt'), RolesGuard) // <--- Activamos ambos guardias
  @Roles(UserRole.ADMIN) // <--- Ponemos el letrero "SOLO ADMINS"
  @Get('ganancias')
  verGanancias(@Request() req) {
    return {
      mensaje: `Hola Director (Rol: ${req.user.rol}), aquí están los millones 💰`,
      saldo_disponible: 1000000,
      moneda: 'MXN'
    };
  }

  @Post(':id/cancel')
  cancelSubscription(@Param('id') id: string) {
    return this.tenantsService.cancelTenantSubscription(id);
  }
}