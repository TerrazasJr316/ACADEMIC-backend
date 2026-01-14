import { Module } from '@nestjs/common';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';

@Module({
  controllers: [StudentsController],
  providers: [StudentsService],
  exports: [StudentsService] // 👈 Importante exportar el servicio
})
export class StudentsModule {}