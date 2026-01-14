import { Controller, Get, Param } from '@nestjs/common';
import { StudentsService } from './students.service';

@Controller('teacher/students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get('group/:groupId')
  findOptional(@Param('groupId') groupId: string) {
    return this.studentsService.findByGroup(groupId);
  }

  @Get()
  findAll() {
    return this.studentsService.findAll();
  }
}