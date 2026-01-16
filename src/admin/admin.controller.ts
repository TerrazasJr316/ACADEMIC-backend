import { Controller, Get, Post, Patch, Body, Param, Delete, UseGuards, Request, Res } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../shared/enums/user-role.enum';
import { CreateGroupDto } from './dtos/create-group.dto';
import { AddStudentDto } from './dtos/add-student-to-group.dto';
import { CreateDocenteDto } from './dtos/create-docente.dto';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN) 
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  getDash(@Request() req) { return this.adminService.getDashboardData(req.user.schoolId, req.user.userId); }

  // --- GRUPOS Y ALUMNOS ---
  @Get('grupos')
  getGrupos(@Request() req) { return this.adminService.getGroups(req.user.schoolId); }

  @Post('grupos')
  saveGrp(@Body() dto: CreateGroupDto, @Request() req) { return this.adminService.saveGroup(dto, req.user.schoolId); }

  @Get('grupos/:id/alumnos')
  getAlums(@Param('id') id: string) { return this.adminService.getStudentsByGroup(id); }

  @Post('alumnos/registrar')
  regAlum(@Body() dto: AddStudentDto, @Request() req) { return this.adminService.addStudentToGroup(dto, req.user.schoolId); }

  @Get('alumnos/:id/historial-detallado')
  getHistorial(@Param('id') id: string) { return this.adminService.getStudentAcademicHistory(id); }

  @Get('alumnos/:id/descargar-historial-completo')
  async descargarHistorial(@Param('id') id: string, @Res() res: any) {
    const csv = await this.adminService.exportStudentAcademicHistory(id);
    res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="Historial_${id}.csv"` });
    res.send('\ufeff' + csv);
  }

  // --- DOCENTES ---
  @Get('docentes')
  getDocs(@Request() req) { return this.adminService.getDocentes(req.user.schoolId); }

  @Post('docentes')
  regDoc(@Body() dto: CreateDocenteDto, @Request() req) { return this.adminService.createDocente(dto, req.user.schoolId); }

  @Get('docentes/:id/perfil')
  getDocProfile(@Param('id') id: string) { return this.adminService.getDocenteProfileById(id); }

  @Patch('docentes/:id/perfil')
  updDocProfile(@Param('id') id: string, @Body() body: any) { return this.adminService.updateDocenteProfile(id, body); }

  @Delete('docentes/:id')
  delDoc(@Param('id') id: string) { return this.adminService.deleteDocente(id); }
}