import { Controller, Get, Param } from '@nestjs/common';
import { AcademicService } from '../service/academic.service';

@Controller('academic')
export class AcademicController {
  constructor(private readonly academicService: AcademicService) {}

  // Ruta para obtener la carga académica de un docente
  @Get('teacher-load/:id') // Aquí sí lleva ":" porque es la ruta
  async getLoad(@Param('id') id: string) {
    // Aquí NO lleva ":" en el string 'id'
    console.log('ID recibido:', id); // Mira tu terminal para ver qué llega
    return await this.academicService.getTeacherLoad(id);
  }
}
