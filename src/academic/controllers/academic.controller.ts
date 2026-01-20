import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Patch,
  Put,
  Query,
} from '@nestjs/common';
import {
  AcademicService,
  GradeInput,
  UpdateProfileDto,
} from '../service/academic.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/roles.guard';

interface RequestWithUser {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@Controller('academic')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AcademicController {
  constructor(private readonly academicService: AcademicService) { }


  @Get('my-courses/:studentId')
  getMyCourses(@Param('studentId') studentId: string) {
    return this.academicService.getStudentCourses(studentId);
  }

  @Get('my-grades/:studentId')
  getMyGrades(@Param('studentId') studentId: string, @Query('periodo') periodo: string) {
    return this.academicService.getStudentGradesByPeriod(studentId, periodo || '2025-1');
  }

  @Get('my-academic-history/:studentId')
  getAcademicHistory(@Param('studentId') studentId: string) {
    return this.academicService.getAcademicHistory(studentId);
  }

  @Get('my-attendance/:studentId')
  getMyAttendance(@Param('studentId') studentId: string) {
    return this.academicService.getStudentAttendance(studentId);
  }


  @Get('teacher-load')
  getTeacherLoad(@Request() req: RequestWithUser) {
    return this.academicService.getTeacherLoad(req.user.userId);
  }

  @Get('stats')
  getStats(@Request() req: RequestWithUser) {
    return this.academicService.getTeacherStats(req.user.userId);
  }

  @Get('groups')
  getGroups(@Request() req: RequestWithUser) {
    return this.academicService.getTeacherGroups(req.user.userId);
  }

  @Get('grades/list/:courseId')
  getGradesList(@Param('courseId') courseId: string) {
    return this.academicService.getStudentsForGrading(courseId);
  }

  @Post('grades/capture/:courseId')
  saveGrades(@Param('courseId') courseId: string, @Body() grades: any[]) {
    return this.academicService.saveGrades(courseId, grades as GradeInput[]);
  }

  @Get('attendance/students/:groupId')
  getStudentsForAttendance(@Param('groupId') groupId: string) {
    return this.academicService.getStudentsForAttendance(groupId);
  }

  @Post('attendance')
  saveAttendance(@Body() body: any) {
    return this.academicService.saveAttendanceBatch(body);
  }

  @Get('profile')
  getProfile(@Request() req: RequestWithUser) {
    return this.academicService.getProfile(req.user.userId);
  }

  @Put('profile')
  updateProfile(@Request() req: RequestWithUser, @Body() body: any) {
    return this.academicService.updateProfile(
      req.user.userId,
      body as UpdateProfileDto,
    );
  }

  @Get('messages/inbox')
  getInbox(@Request() req: RequestWithUser) {
    return this.academicService.getInbox(req.user.userId);
  }

  @Get('messages/sent')
  getSent(@Request() req: RequestWithUser) {
    return this.academicService.getSent(req.user.userId);
  }

  @Post('messages/send')
  sendMessage(
    @Request() req: RequestWithUser,
    @Body() body: { to: string; subject: string; message: string },
  ) {
    return this.academicService.sendMessage(
      req.user.userId,
      body.to,
      body.subject,
      body.message,
    );
  }

  @Patch('messages/read/:id')
  readMessage(@Param('id') id: string) {
    return this.academicService.markMessageRead(id);
  }

  @Get('dashboard/summary/:studentId')
  getDashboardSummary(@Param('studentId') studentId: string) {
    return this.academicService.getStudentDashboardSummary(studentId);
  }
}