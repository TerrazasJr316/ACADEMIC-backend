import { Module, forwardRef } from '@nestjs/common'; 
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

// Entidades necesarias
import { User } from '../users/entities/user.entity';
import { StudentProfile } from '../student/entities/student-profile.entity';
import { TeacherProfile } from '../teacher/entities/teacher-profile.entity';
import { AdminProfile } from './entities/admin-profile.entity'; 
import { Group } from '../academic/entities/group.entity';
import { Enrollment } from '../academic/entities/enrollment.entity';
import { AcademicPeriod } from '../academic/entities/academic-period.entity';
import { Subject } from '../academic/entities/subject.entity';
import { Course } from '../academic/entities/course.entity';
import { School } from '../tenants/entities/school.entity';
import { InternalMessage } from '../communications/entities/internal-message.entity';
import { GradeReport } from '../academic/entities/grade-report.entity';
import { AttendanceDetail } from '../academic/entities/attendance-detail.entity';
import { Schedule } from '../academic/entities/schedule.entity'; // ✅ AGREGADO

import { AuthModule } from '../auth/auth.module';
import { AcademicModule } from '../academic/academic.module';

@Module({
  imports: [
    AuthModule,
    forwardRef(() => AcademicModule),
    TypeOrmModule.forFeature([
      User,
      AdminProfile, 
      Group,
      Enrollment,
      StudentProfile,
      TeacherProfile,
      AcademicPeriod,
      School,
      InternalMessage,
      Subject,
      Course,
      GradeReport,
      AttendanceDetail,
      Schedule, // ✅ AGREGADO: Esto permite que AdminService use el repositorio de horarios
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}