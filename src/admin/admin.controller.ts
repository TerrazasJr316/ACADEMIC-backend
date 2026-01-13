import { Controller, Get, Post, Body, Patch, Param, Delete, NotFoundException, Res, Header } from '@nestjs/common';
import type { Response } from 'express'; 
import { AdminService } from './admin.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ReportQueryDto } from './dto/report-query.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // --- SECCIÓN: GRUPOS ---
  @Post('groups')
  createGroup(@Body() createGroupDto: CreateGroupDto) {
    return this.adminService.create(createGroupDto);
  }

  @Get('groups')
  getAllGroups() {
    return this.adminService.findAll();
  }

  // Actualizado para la modal "Editar Grupo"
  @Patch('groups/:id')
  updateGroup(@Param('id') id: string, @Body() updateDto: any) {
    const updated = this.adminService.update(id, updateDto);
    if (!updated) throw new NotFoundException('El grupo no existe');
    return updated;
  }

  // Actualizado para el enlace "Eliminar grupo"
  @Delete('groups/:id')
  removeGroup(@Param('id') id: string) {
    const deleted = this.adminService.remove(id);
    if (!deleted) throw new NotFoundException('No se pudo eliminar el grupo');
    return { message: 'Grupo eliminado con éxito' };
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

  // Ruta para la modal "Editar Plan"
  @Patch('plans/:id')
  updatePlan(@Param('id') id: string, @Body() dto: any) {
    const updated = this.adminService.updatePlan(id, dto);
    if (!updated) throw new NotFoundException('El plan de estudio no existe');
    return updated;
  }

  // Ruta para eliminar Plan
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

  // Ruta para la modal "Editar Materia"
  @Patch('subjects/:id')
  updateSubject(@Param('id') id: string, @Body() dto: any) {
    const updated = this.adminService.updateSubject(id, dto);
    if (!updated) throw new NotFoundException('La materia no existe');
    return updated;
  }

  // Ruta para eliminar Materia
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