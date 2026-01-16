import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

import { AdminProfile } from './entities/admin-profile.entity';
import { User } from '../users/entities/user.entity';
import { School } from '../tenants/entities/school.entity';
import { Message } from './entities/message.entity';
import { AcademicPeriod } from '../academic/entities/academic-period.entity';
import { Subject } from '../academic/entities/subject.entity';
import { Group } from '../academic/entities/group.entity';
import { Enrollment } from '../academic/entities/enrollment.entity';
import { Course } from '../academic/entities/course.entity';
import { GradeCard } from '../academic/entities/grade-card.entity';
import { StudentProfile } from '../student/entities/student-profile.entity';
import { TeacherProfile } from '../teacher/entities/teacher-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AdminProfile, User, School, Message, AcademicPeriod, 
      Subject, Group, Enrollment, Course, GradeCard, 
      StudentProfile, TeacherProfile
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService]
})
export class AdminModule {}