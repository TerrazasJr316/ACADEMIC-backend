// src/student/student.controller.ts
import { Controller, Get, Param, Query } from '@nestjs/common';
import { StudentService } from './student.service';

@Controller('student')
export class StudentController {
  constructor(private readonly studentService: StudentService) { }

  @Get(':id/asignaturas')
  getAsignaturas(@Param('id') id: string) {
    return this.studentService.getSubjects(id);
  }

  @Get(':id/profile')
  getProfile(@Param('id') id: string) {
    return this.studentService.getProfile(id);
  }

  @Get(':id/history')
  getHistory(@Param('id') id: string) {
    return this.studentService.getAcademicHistory(id);
  }

  @Get(':id/periods')
  getPeriods(@Param('id') id: string) {
    return this.studentService.getAvailablePeriods(id);
  }

  @Get(':id/grades')
  getGrades(@Param('id') id: string, @Query('periodo') periodo: string) {
    return this.studentService.getPartialGrades(id, periodo);
  }

  @Get(':id/attendance')
  getAttendance(@Param('id') id: string) {
    return this.studentService.getAttendanceData(id);
  }

  @Get(':id/attendance-details')
  getAttendanceDetails(@Param('id') id: string) {
    return this.studentService.getAttendanceDetails(id);
  }

  @Get(':id/notifications')
  getNotifications(@Param('id') id: string) {
    return this.studentService.getNotifications(id);
  }
}