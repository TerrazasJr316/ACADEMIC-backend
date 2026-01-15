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
} from '@nestjs/common';
import { AcademicService } from '../service/academic.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/roles.guard';

// Interfaz para que TS sepa qué tiene el request
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
  constructor(private readonly academicService: AcademicService) {}

  // --- DASHBOARD & GRUPOS ---
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

  // --- CALIFICACIONES ---
  @Get('grades/list/:courseId')
  getGradesList(@Param('courseId') courseId: string) {
    return this.academicService.getStudentsForGrading(courseId);
  }

  @Post('grades/capture/:courseId')
  saveGrades(@Param('courseId') courseId: string, @Body() grades: any[]) {
    // grades entra como any[] porque es una estructura compleja del front,
    // pero el servicio lo validará.
    return this.academicService.saveGrades(courseId, grades);
  }

  // --- ASISTENCIA ---
  @Get('attendance/students/:groupId')
  getStudentsForAttendance(@Param('groupId') groupId: string) {
    return this.academicService.getStudentsForAttendance(groupId);
  }

  @Post('attendance')
  saveAttendance(@Body() body: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.academicService.saveAttendanceBatch(body);
  }

  // --- PERFIL ---
  @Get('profile')
  getProfile(@Request() req: RequestWithUser) {
    return this.academicService.getProfile(req.user.userId);
  }

  @Put('profile')
  updateProfile(@Request() req: RequestWithUser, @Body() body: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.academicService.updateProfile(req.user.userId, body);
  }

  // --- MENSAJES ---
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
}
