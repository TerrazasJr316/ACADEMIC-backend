import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { StudentService } from './student.service';
// Asumiendo que usas el mismo sistema de Auth del líder
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; 

@Controller('student')
// @UseGuards(JwtAuthGuard) // Descomentar cuando el líder pase el Auth
export class StudentController {
    constructor(private readonly studentService: StudentService) { }

    // Obtener el perfil completo para el Dashboard y Configuración
    @Get('profile/:userId')
    getProfile(@Param('userId') userId: string) {
        return this.studentService.getStudentProfile(userId);
    }

    // Obtener resumen para el Dashboard (Notificaciones + Estadísticas)
    @Get('dashboard/summary/:userId')
    getDashboardSummary(@Param('userId') userId: string) {
        return this.studentService.getDashboardSummary(userId);
    }
}