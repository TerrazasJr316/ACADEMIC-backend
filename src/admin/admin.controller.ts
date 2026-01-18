import { Controller, Get, Post, Delete, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../shared/enums/user-role.enum';
import { CreateGroupDto } from './dtos/create-group.dto';
import { AddStudentDto } from './dtos/add-student-to-group.dto';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN) 
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // --- SECCIÓN DE GRUPOS ---

  @Get('grupos')
  getGroups(@Request() req) {
    return this.adminService.getGroups(req.user.schoolId);
  }

  @Post('grupos')
  saveGrp(@Body() dto: CreateGroupDto, @Request() req) { 
    return this.adminService.saveGroup(dto, req.user.schoolId); 
  }

  @Patch('grupos/:id') 
  updateGroup(@Param('id') id: string, @Body() dto: any) {
    return this.adminService.updateGroup(id, dto);
  }

  @Delete('grupos/:id')
  deleteGroup(@Param('id') id: string) {
    return this.adminService.deleteGroup(id);
  }

  // --- SECCIÓN DE ALUMNOS ---

  @Get('grupos/:id/alumnos')
  getAlums(@Param('id') id: string) { 
    return this.adminService.getStudentsByGroup(id); 
  }

  @Post('alumnos')
  regAlum(@Body() dto: AddStudentDto, @Request() req) { 
    return this.adminService.addStudentToGroup(dto, req.user.schoolId); 
  }

  @Delete('alumnos/:id')
  deleteAlum(@Param('id') id: string) {
    return this.adminService.deleteStudent(id);
  }

  @Get('alumnos/:id/historial')
  getHist(@Param('id') id: string) { 
    return this.adminService.getStudentAcademicHistory(id); 
  }

  @Get('alumnos/:id/perfil-completo')
  getPerf(@Param('id') id: string) { 
    return this.adminService.getAlumnoFullProfile(id); 
  }
}