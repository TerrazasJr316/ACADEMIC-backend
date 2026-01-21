import { Controller, Get, Post, Body, Param, UseGuards, Request, Patch, Put, Query } from '@nestjs/common';
import { AcademicService, GradeInput } from '../service/academic.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/roles.guard';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiResponse
} from '@nestjs/swagger';

// Interfaz para el tipado de la petición
interface RequestWithUser { user: { userId: string; email: string; role: string; }; }

@ApiTags('Academic')
@ApiBearerAuth()
@Controller('academic')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AcademicController {
  constructor(private readonly academicService: AcademicService) { }

  // =================================================================
  //  SECCIÓN DE ESTUDIANTES
  // =================================================================

  @ApiOperation({ summary: 'Obtener cursos de un estudiante' })
  @ApiParam({ name: 'studentId', description: 'UUID del estudiante' })
  @Get('my-courses/:studentId')
  getMyCourses(@Param('studentId') studentId: string) {
    return this.academicService.getStudentCourses(studentId);
  }

  @ApiOperation({ summary: 'Obtener calificaciones por periodo' })
  @ApiParam({ name: 'studentId', description: 'UUID del estudiante' })
  @ApiQuery({ name: 'periodo', required: false })
  @Get('my-grades/:studentId')
  getMyGrades(@Param('studentId') studentId: string, @Query('periodo') periodo: string) {
    return this.academicService.getStudentGradesByPeriod(studentId, periodo || '2025-1');
  }

  @ApiOperation({ summary: 'Consultar historial académico completo' })
  @Get('my-academic-history/:studentId')
  getAcademicHistory(@Param('studentId') studentId: string) {
    return this.academicService.getAcademicHistory(studentId);
  }

  @ApiOperation({ summary: 'Consultar historial de asistencias' })
  @Get('my-attendance/:studentId')
  getMyAttendance(@Param('studentId') studentId: string) {
    return this.academicService.getStudentAttendance(studentId);
  }

  @ApiOperation({ summary: 'Resumen del dashboard del estudiante' })
  @Get('dashboard/summary/:studentId')
  getDashboardSummary(@Param('studentId') studentId: string) {
    return this.academicService.getStudentDashboardSummary(studentId);
  }

  @ApiOperation({ summary: 'Obtener periodos cursados por el estudiante' })
  @Get('my-periods/:studentId')
  getMyPeriods(@Param('studentId') studentId: string) {
    return this.academicService.getStudentPeriods(studentId);
  }

  // =================================================================
  //  SECCIÓN DE DOCENTES / PERFILES
  // =================================================================

  @ApiOperation({ summary: 'Obtener perfil del usuario actual (Docente)' })
  @Get('profile')
  async getProfile(@Request() req: RequestWithUser) {
    const profile = await this.academicService.getProfile(req.user.userId);
    if (!profile) return null;
    const profileData = JSON.parse(JSON.stringify(profile));
    const idRef = profileData.id || profileData.user?.id || req.user.userId;
    const claveGenerada = idRef.substring(0, 8).toUpperCase();
    return { 
      ...profileData, 
      clave: profileData.claveEmpleado || claveGenerada, 
      nombre: profileData.user?.fullName || profileData.nombre 
    };
  }

  @ApiOperation({ summary: 'Actualizar perfil (Docente o Admin editando docente)' })
  @Put(['profile', 'profile/:id']) 
  async updateProfile(
    @Request() req: RequestWithUser, 
    @Body() body: any, 
    @Param('id') id?: string
  ) {
    const targetId = id || req.user.userId;
    console.log(`[DEBUG] Actualizando perfil para ID: ${targetId}`);
    return this.academicService.updateProfile(targetId, body);
  }

  @ApiOperation({ summary: 'Estadísticas del docente' })
  @Get('stats')
  getStats(@Request() req: RequestWithUser) {
    return this.academicService.getTeacherStats(req.user.userId);
  }

  @ApiOperation({ summary: 'Carga académica del docente' })
  @Get('teacher-load')
  getTeacherLoad(@Request() req: RequestWithUser) { 
    return this.academicService.getTeacherLoad(req.user.userId); 
  }

  @ApiOperation({ summary: 'Grupos asignados al docente' })
  @Get('groups')
  getGroups(@Request() req: RequestWithUser) { 
    return this.academicService.getTeacherGroups(req.user.userId); 
  }

  // =================================================================
  //  CALIFICACIONES Y MENSAJERÍA
  // =================================================================

  @ApiOperation({ summary: 'Lista de alumnos para calificar' })
  @Get('grades/list/:courseId')
  getGradesList(@Param('courseId') courseId: string) { 
    return this.academicService.getStudentsForGrading(courseId); 
  }

  @ApiOperation({ summary: 'Capturar calificaciones' })
  @Post('grades/capture/:courseId')
  saveGrades(@Param('courseId') courseId: string, @Body() grades: any[]) { 
    return this.academicService.saveGrades(courseId, grades as GradeInput[]); 
  }

  @ApiOperation({ summary: 'Bandeja de entrada' })
  @Get('messages/inbox')
  getInbox(@Request() req: RequestWithUser) { 
    return this.academicService.getInbox(req.user.userId); 
  }

  @ApiOperation({ summary: 'Mensajes enviados' })
  @Get('messages/sent')
  getSent(@Request() req: RequestWithUser) {
    return this.academicService.getSent(req.user.userId);
  }

  @ApiOperation({ summary: 'Enviar mensaje nuevo' })
  @Post('messages/send')
  sendMessage(@Request() req: RequestWithUser, @Body() body: { to: string; subject: string; message: string }) {
    return this.academicService.sendMessage(req.user.userId, body.to, body.subject, body.message);
  }

  @ApiOperation({ summary: 'Marcar mensaje como leído' })
  @Patch('messages/read/:id')
  readMessage(@Param('id') id: string) { 
    return this.academicService.markMessageRead(id); 
  }
}