// src/academic/entities/grade-report.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Enrollment } from './enrollment.entity';
import { Course } from './course.entity';
import { EstadoCalificacion } from '../../shared/enums/grade-status.enum';

@Entity('boletas_calificaciones')
export class GradeReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Vincula al Alumno (A través de su inscripción)
  @ManyToOne(() => Enrollment)
  @JoinColumn({ name: 'id_inscripcion' })
  enrollment: Enrollment;

  // Vincula la Materia/Docente
  @ManyToOne(() => Course)
  @JoinColumn({ name: 'id_curso' })
  course: Course;

  // --- CORRECCIÓN: Agregamos "| null" para que TypeScript acepte vacíos ---

  @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true, name: 'parcial_1' })
  parcial1: number | null; // <--- CAMBIO AQUÍ

  @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true, name: 'parcial_2' })
  parcial2: number | null; // <--- CAMBIO AQUÍ

  @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true, name: 'parcial_3' })
  parcial3: number | null; // <--- CAMBIO AQUÍ

  @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true, name: 'promedio_final' })
  promedioFinal: number | null; // <--- CAMBIO AQUÍ

  @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true })
  extraordinario: number | null; // <--- CAMBIO AQUÍ

  // ------------------------------------------------------------------------

  @Column({ name: 'porcentaje_asistencia_global', type: 'int', default: 100 })
  porcentajeAsistenciaGlobal: number;

  @Column({
    type: 'enum',
    enum: EstadoCalificacion,
    default: EstadoCalificacion.NA
  })
  estado: EstadoCalificacion;

  @Column({ type: 'text', nullable: true })
  observaciones: string;
}