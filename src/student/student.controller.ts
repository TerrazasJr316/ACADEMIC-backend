import { Controller, Get, Param } from '@nestjs/common';
import { StudentService } from './student.service';

@Controller('student')
export class StudentController {
    constructor(private readonly studentService: StudentService) { }

    @Get('profile/:userId')
    getProfile(@Param('userId') userId: string) {
        return this.studentService.getStudentProfile(userId);
    }

    // Ruta para getAlumnoDashboardSummary
    @Get('dashboard/summary/:userId')
    getDashboardSummary(@Param('userId') userId: string) {
        return this.studentService.getDashboardSummary(userId);
    }
}