import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcademicPeriod } from './entities/academic-period.entity';
import { Group } from './entities/group.entity';
import { Subject } from './entities/subject.entity';
import { Course } from './entities/course.entity';
import { Schedule } from './entities/schedule.entity';
import { Enrollment } from './entities/enrollment.entity';
import { GradeCard } from './entities/grade-card.entity';
import { AttendanceDetail } from './entities/attendance-detail.entity';
import { AcademicController } from './controllers/academic.controller';
import { AcademicService } from './service/academic.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AcademicPeriod,
      Group,
      Subject,
      Course,
      Schedule,
      Enrollment,
      GradeCard,
      AttendanceDetail,
    ]),
  ],
  controllers: [AcademicController],
  providers: [AcademicService],
})
export class AcademicModule {}
