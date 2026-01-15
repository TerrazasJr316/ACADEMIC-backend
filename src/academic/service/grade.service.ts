// src/academic/service/grade.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
// Asumiendo que estas son tus entidades y enums
// import { GradeReport } from '../entities/grade-report.entity';
// import { EstadoCalificacion } from '../enums/estado-calificacion.enum';

@Injectable()
export class GradeService {
  constructor(
    @InjectRepository(GradeReport)
    private readonly gradeRepository: Repository<GradeReport>,
  ) {}

  async saveGrades(courseId: string, gradesData: any[]) {
    const results = [];

    for (const data of gradesData) {
      // 1. Buscamos si ya existe una boleta para este alumno en este curso/asignatura
      // O creamos una nueva instancia
      let grade = await this.gradeRepository.findOne({ 
        where: { alumnoId: data.id, cursoId: courseId } 
      });

      if (!grade) {
        grade = new GradeReport();
        grade.alumnoId = data.id;
        grade.cursoId = courseId;
      }

      // 2. Lógica de conversión: Menor a 70 o texto "NA" = null
      const parseGrade = (val: any) => {
        const num = parseFloat(val);
        return (isNaN(num) || num < 70) ? null : num;
      };

      const p1 = parseGrade(data.parcial1);
      const p2 = parseGrade(data.parcial2);
      const p3 = parseGrade(data.parcial3);

      grade.parcial1 = p1;
      grade.parcial2 = p2;
      grade.parcial3 = p3;

      // 3. Calcular Unidades que debe para el extraordinario
      const unidadesDebidas = [];
      if (data.parcial1 === 'NA' || (p1 === null && data.parcial1 !== '')) unidadesDebidas.push('P1');
      if (data.parcial2 === 'NA' || (p2 === null && data.parcial2 !== '')) unidadesDebidas.push('P2');
      if (data.parcial3 === 'NA' || (p3 === null && data.parcial3 !== '')) unidadesDebidas.push('P3');

      // 4. Determinar estado y promedio
      if (unidadesDebidas.length > 0) {
        grade.estado = EstadoCalificacion.NA;
        grade.promedioFinal = null; 
        grade.observaciones = `Debe: ${unidadesDebidas.join(', ')}`;
      } else {
        // Solo calculamos promedio si los 3 parciales están presentes y aprobados
        if (p1 !== null && p2 !== null && p3 !== null) {
          grade.estado = EstadoCalificacion.APROBADO;
          grade.promedioFinal = Math.round((p1 + p2 + p3) / 3);
          grade.observaciones = 'ORDINARIO';
        } else {
          grade.estado = EstadoCalificacion.PENDIENTE;
          grade.promedioFinal = null;
        }
      }

      results.push(await this.gradeRepository.save(grade));
    }
    
    return { success: true, count: results.length };
  }
}
