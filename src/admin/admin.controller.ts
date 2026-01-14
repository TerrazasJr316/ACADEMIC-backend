import { Controller, Get, Post, Body, Patch, Param, Delete, NotFoundException, Res, Header } from '@nestjs/common';
import type { Response } from 'express'; 
import { AdminService } from './admin.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ReportQueryDto } from './dto/report-query.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // --- SECCIÓN: DASHBOARD (NUEVO) ---

  // Obtiene los contadores para las tarjetas principales (Alumnos, Docentes, Grupos)
  @Get('dashboard/stats')
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  // --- SECCIÓN: DOCENTES (NUEVO) ---

  // Obtiene la lista para la tabla de docentes
  @Get('teachers')
  getTeachers() {
    return this.adminService.findAllTeachers();
  }

  // Registra un docente desde la modal "Registrar Nuevo Docente"
  @Post('teachers')
  addTeacher(@Body() dto: any) {
    return this.adminService.createTeacher(dto);
  }

  // Elimina el perfil del docente (Acción del botón basurero)
  @Delete('teachers/:id')
  deleteTeacher(@Param('id') id: string) {
    const deleted = this.adminService.removeTeacher(id);
    if (!deleted) throw new NotFoundException('El docente no existe');
    return { message: 'Docente eliminado correctamente' };
  }

  // --- SECCIÓN: GRUPOS ---
  @Post('groups')
  createGroup(@Body() createGroupDto: CreateGroupDto) {
    return this.adminService.create(createGroupDto);
  }

  @Get('groups')
  getAllGroups() {
    return this.adminService.findAll();
  }

  @Patch('groups/:id')
  updateGroup(@Param('id') id: string, @Body() updateDto: any) {
    const updated = this.adminService.update(id, updateDto);
    if (!updated) throw new NotFoundException('El grupo no existe');
    return updated;
  }

  @Delete('groups/:id')
  removeGroup(@Param('id') id: string) {
    const deleted = this.adminService.remove(id);
    if (!deleted) throw new NotFoundException('No se pudo eliminar el grupo');
    return { message: 'Grupo eliminado con éxito' };
  }

  // --- SECCIÓN: ESTUDIANTES ---

  @Get('groups/:groupId/students')
  getStudents(@Param('groupId') groupId: string) {
    const students = this.adminService.getStudentsByGroup(groupId);
    if (!students) throw new NotFoundException('No se encontraron alumnos');
    return students;
  }

  @Post('students')
  addStudent(@Body() dto: any) {
    return this.adminService.createStudent(dto);
  }

  @Get('students/:id')
  getStudentProfile(@Param('id') id: string) {
    const profile = this.adminService.getStudentById(id);
    if (!profile) throw new NotFoundException('Alumno no encontrado');
    return profile;
  }

  @Patch('students/:id')
  updateStudent(@Param('id') id: string, @Body() dto: any) {
    const updated = this.adminService.updateStudent(id, dto);
    if (!updated) throw new NotFoundException('No se pudo actualizar el perfil');
    return updated;
  }

  @Get('groups/:groupId/export-students-pdf')
  @Header('Content-Type', 'application/pdf')
  async exportStudentList(@Param('groupId') groupId: string, @Res() res: Response) {
    const buffer = await this.adminService.getStudentListPDF(groupId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=lista_alumnos_${groupId}.pdf`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('students/:id/export-history-pdf')
  @Header('Content-Type', 'application/pdf')
  async exportStudentHistory(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.adminService.getStudentHistoryPDF(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=historial_academico_${id}.pdf`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  // --- SECCIÓN: MENSAJES ---
  @Post('messages')
  sendGlobalMessage(@Body() sendMessageDto: SendMessageDto) {
    return this.adminService.sendMessage(sendMessageDto);
  }

  @Get('messages/history')
  getHistory() {
    return this.adminService.getMessageHistory();
  }

  // --- SECCIÓN: GESTIÓN ACADÉMICA (PLANES) ---
  @Get('plans')
  getPlans() {
    return this.adminService.findAllPlans();
  }

  @Post('plans')
  addPlan(@Body() dto: any) {
    return this.adminService.createPlan(dto);
  }

  @Patch('plans/:id')
  updatePlan(@Param('id') id: string, @Body() dto: any) {
    const updated = this.adminService.updatePlan(id, dto);
    if (!updated) throw new NotFoundException('El plan de estudio no existe');
    return updated;
  }

  @Delete('plans/:id')
  removePlan(@Param('id') id: string) {
    const deleted = this.adminService.removePlan(id);
    if (!deleted) throw new NotFoundException('No se pudo eliminar el plan');
    return { message: 'Plan eliminado correctamente' };
  }

  // --- SECCIÓN: GESTIÓN ACADÉMICA (MATERIAS) ---
  @Get('plans/:id/subjects')
  getSubjects(@Param('id') id: string) {
    return this.adminService.getSubjectsByPlan(id);
  }

  @Post('subjects')
  addSubject(@Body() dto: any) {
    return this.adminService.createSubject(dto);
  }

  @Patch('subjects/:id')
  updateSubject(@Param('id') id: string, @Body() dto: any) {
    const updated = this.adminService.updateSubject(id, dto);
    if (!updated) throw new NotFoundException('La materia no existe');
    return updated;
  }

  @Delete('subjects/:id')
  removeSubject(@Param('id') id: string) {
    const deleted = this.adminService.removeSubject(id);
    if (!deleted) throw new NotFoundException('No se pudo eliminar la materia');
    return { message: 'Materia eliminada correctamente' };
  }

  // --- SECCIÓN: REPORTES ACADÉMICOS ---
  @Post('reports/preview')
  getReportPreview(@Body() queryDto: ReportQueryDto) {
    const data = this.adminService.generateAcademicReport(queryDto);
    if (!data || data.length === 0) {
      throw new NotFoundException('No se encontraron datos para los filtros seleccionados');
    }
    return data;
  }

  @Post('reports/export-pdf')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename=reporte_academico.pdf')
  async exportPDF(@Body() queryDto: ReportQueryDto, @Res() res: Response) {
    const buffer = await this.adminService.getReportPDF(queryDto);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=reporte_academico.pdf',
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}