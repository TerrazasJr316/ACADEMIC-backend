import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Controladores y Servicios
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

// Entidades de Usuarios y Perfiles
import { User } from '../users/entities/user.entity';
import { StudentProfile } from '../student/entities/student-profile.entity';
import { TeacherProfile } from '../teacher/entities/teacher-profile.entity';
// ✅ IMPORTANTE: Verifica que esta ruta sea la correcta en tu proyecto
import { AdminProfile } from './entities/admin-profile.entity'; 

// Entidades Académicas
import { Group } from '../academic/entities/group.entity';
import { Enrollment } from '../academic/entities/enrollment.entity';
import { AcademicPeriod } from '../academic/entities/academic-period.entity';
import { Subject } from '../academic/entities/subject.entity';
import { Course } from '../academic/entities/course.entity';

// Entidades de Infraestructura/Comunicaciones
import { School } from '../tenants/entities/school.entity';
import { InternalMessage } from '../communications/entities/internal-message.entity';

// Otros Módulos
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      User,
      AdminProfile, // ✅ AGREGADO: Esto soluciona el error de "Entity metadata not found"
      Group,
      Enrollment,
      StudentProfile,
      TeacherProfile,
      AcademicPeriod,
      School,
      InternalMessage,
      Subject,
      Course,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}