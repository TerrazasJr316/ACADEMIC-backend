import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Enrollment } from './enrollment.entity';
import { Course } from './course.entity';
import { EstadoCalificacion } from '../../shared/enums/grade-status.enum'; // ✅ Correcto

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

  // Calificaciones con decimales (Ej: 8.5)
  // Usamos 'nullable: true' porque al inicio del semestre están vacías
  @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true, name: 'parcial_1' })
  parcial1: number;

  @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true, name: 'parcial_2' })
  parcial2: number;

  @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true, name: 'parcial_3' })
  parcial3: number;

  @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true, name: 'promedio_final' })
  promedioFinal: number;

  @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true })
  extraordinario: number;

  @Column({ name: 'porcentaje_asistencia_global', type: 'int', default: 100 })
  porcentajeAsistenciaGlobal: number;

  // ...
  @Column({
    type: 'enum',
    enum: EstadoCalificacion, // <--- Aquí también
    default: EstadoCalificacion.NA // <--- Y aquí
  })
  estado: EstadoCalificacion; // <--- Y el tipo de dato

  @Column({ type: 'text', nullable: true })
  observaciones: string;
}