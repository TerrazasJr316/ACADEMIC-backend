// src/academic/controller/grade.controller.ts

import { Controller, Post, Body, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { GradeService } from '../service/grade.service';
// import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'; // Si usas auth

@Controller('grades')
// @UseGuards(JwtAuthGuard)
export class GradeController {
  constructor(private readonly gradeService: GradeService) {}

  @Post('capture/:courseId')
  async captureGrades(
    @Param('courseId') courseId: string,
    @Body() gradesData: any[]
  ) {
    return await this.gradeService.saveGrades(courseId, gradesData);
  }
}
