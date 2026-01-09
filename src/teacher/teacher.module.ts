import { Module } from '@nestjs/common';
import { TeacherController } from './teacher.controller';
import { TeacherService } from './teacher.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subject } from './entites/subject.entity'; // Asegúrate de que esta ruta sea correcta

@Module({
  imports: [TypeOrmModule.forFeature([Subject])],
  controllers: [TeacherController],
  providers: [TeacherService],
  exports: [TeacherService], // Exportamos el servicio por si acaso
})
export class TeacherModule {} // <--- IMPORTANTE: Asegúrate de que diga "export class"
