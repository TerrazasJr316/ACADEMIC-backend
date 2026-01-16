import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';
import { StudentProfile } from './entities/student-profile.entity';
import { User } from '../users/entities/user.entity'; // Necesario para la relación

@Module({
  imports: [
    TypeOrmModule.forFeature([StudentProfile, User])
  ],
  controllers: [StudentController],
  providers: [StudentService],
  exports: [StudentService]
})
export class StudentModule { }