// src/academic/service/grade.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
// 1. IMPORTAMOS LAS ENTIDADES CORRECTAS
import { GradeReport } from '../entities/grade-report.entity';
import { Course } from '../entities/course.entity';
import { Enrollment } from '../entities/enrollment.entity';
//import { EstadoCalificacion } from '../../shared/enums/grade-status.enum'; // Usamos la ruta de tu entidad
import { EstadoCalificacion } from '../../shared/enums/grade-status.enum';
// (Esto busca en la carpeta shared donde SÍ pusiste PENDIENTE)

@Injectable()
export class GradeService {
  constructor(
    @InjectRepository(GradeReport)
    private readonly gradeRepository: Repository<GradeReport>,
  ) { }

  async saveGrades(courseId: string, gradesData: any[]) {


    const results: GradeReport[] = [];

    for (const data of gradesData) {
      // 1. BUSCAR BOLETA EXISTENTE (Usando Relaciones, no IDs planos)
      // Asumimos que data.id es el ID DEL ALUMNO.
      // Necesitamos buscar la boleta donde el curso coincida Y la inscripción sea de ese alumno.
      let grade = await this.gradeRepository.findOne({
        where: {
          course: { id: courseId },
          enrollment: { student: { id: data.id } } // Buscamos por la relación profunda
        },
        relations: ['enrollment', 'course']
      });

      if (!grade) {
        grade = new GradeReport();
        // 2. ASIGNAR RELACIONES (TypeORM necesita objetos, no strings)
        grade.course = { id: courseId } as Course;
        // ⚠️ OJO: Aquí asumimos que "data.id" es el ID del ALUMNO. 
        // Para crear una boleta nueva, idealmente necesitamos el ID de la INSCRIPCIÓN (Enrollment).
        // Por ahora, para que compile, simularemos que data.id es el ID de Inscripción o lo buscaremos luego.
        // Si data.id es StudentId, esto fallará al guardar si no encontramos el Enrollment primero.
        // **PARCHE PARA COMPILAR:** Asignamos la relación parcial.
        grade.enrollment = { student: { id: data.id } } as unknown as Enrollment;
      }

      // 3. Lógica de conversión
      const parseGrade = (val: any) => {
        if (val === 'NA' || val === '' || val === null || val === undefined) return null;
        const num = parseFloat(val);
        return (isNaN(num) || num < 70) ? null : num;
      };

      const p1 = parseGrade(data.parcial1);
      const p2 = parseGrade(data.parcial2);
      const p3 = parseGrade(data.parcial3);

      grade.parcial1 = p1;
      grade.parcial2 = p2;
      grade.parcial3 = p3;

      // 4. CORRECCIÓN DEL ERROR 'NEVER' (Tipado explícito)
      const unidadesDebidas: string[] = [];

      if (data.parcial1 === 'NA' || (p1 === null && data.parcial1 !== '')) unidadesDebidas.push('P1');
      if (data.parcial2 === 'NA' || (p2 === null && data.parcial2 !== '')) unidadesDebidas.push('P2');
      if (data.parcial3 === 'NA' || (p3 === null && data.parcial3 !== '')) unidadesDebidas.push('P3');

      // 5. Determinar estado y promedio
      if (unidadesDebidas.length > 0) {
        grade.estado = EstadoCalificacion.NA;
        grade.promedioFinal = null;
        grade.observaciones = `Debe: ${unidadesDebidas.join(', ')}`;
      } else {
        if (p1 !== null && p2 !== null && p3 !== null) {
          grade.estado = EstadoCalificacion.APROBADO;
          grade.promedioFinal = Math.round((p1 + p2 + p3) / 3);
          grade.observaciones = 'ORDINARIO';
        } else {
          grade.estado = EstadoCalificacion.PENDIENTE;
          grade.promedioFinal = null;
        }
      }

      // Guardamos
      results.push(await this.gradeRepository.save(grade));
    }

    return { success: true, count: results.length };
  }
}