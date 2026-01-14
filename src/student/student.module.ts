import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentProfile } from './entities/student-profile.entity'; // <--- Importar Entidad

@Module({
  imports: [
    TypeOrmModule.forFeature([StudentProfile]) // <--- ¡ESTO ES LO QUE FALTA!
  ],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule]
})
export class StudentModule {}