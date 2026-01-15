import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../shared/enums/user-role.enum';

@Controller('finance')
@UseGuards(AuthGuard('jwt'), RolesGuard) // 🔒 Protegido para todos
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  // 1. CREAR PRECIO (Solo el Director puede definir precios)
  @Post('catalog')
  @Roles(UserRole.ADMIN)
  createConcept(@Body() body: any, @Request() req) {
    // Usamos el ID de la escuela que viene en el Token del usuario
    const schoolId = req.user.schoolId; 
    return this.financeService.createConcept(body, schoolId);
  }

  // 2. VER PRECIOS (Alumnos y Docentes pueden ver cuánto cuestan las cosas)
  @Get('catalog')
  getMenu(@Request() req) {
    return this.financeService.findAll(req.user.schoolId);
  }
}