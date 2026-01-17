import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';
import { StudentProfile } from './entities/student-profile.entity';
import { User } from '../users/entities/user.entity';
import { CommunicationsModule } from '../communications/communications.module'; // Importamos el módulo hermano

@Module({
  imports: [
    TypeOrmModule.forFeature([StudentProfile, User]),
    CommunicationsModule // Agregamos la dependencia aquí
  ],
  controllers: [StudentController],
  providers: [StudentService],
  exports: [StudentService]
})
export class StudentModule { }