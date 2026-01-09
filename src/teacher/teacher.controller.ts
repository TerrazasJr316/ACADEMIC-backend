import { Controller, Get } from '@nestjs/common';
import { TeacherService } from './teacher.service';

@Controller('teacher') // Ruta: localhost:3000/teacher
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  @Get('groups') // Ruta completa: localhost:3000/teacher/groups
  @Get('groups')
  getGroups() {
    return this.teacherService.getAcademicLoad(); // <--- Sin nada dentro del paréntesis
  }
}
