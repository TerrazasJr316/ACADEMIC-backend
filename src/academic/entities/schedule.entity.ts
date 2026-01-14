import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Course } from './course.entity';
import { WeekDay } from '../../shared/enums/week-days.enum';

@Entity('horarios')
export class Schedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // RELACIÓN: Un horario pertenece a un Curso específico
  @ManyToOne(() => Course, (course) => course.schedules)
  @JoinColumn({ name: 'id_curso' })
  course: Course;

  @Column({
    type: 'enum',
    enum: WeekDay
  })
  diaSemana: WeekDay;

  // En Postgres, el tipo 'time' guarda horas sin fecha (ej: "14:00:00")
  @Column({ name: 'hora_inicio', type: 'time' })
  horaInicio: string;

  @Column({ name: 'hora_fin', type: 'time' })
  horaFin: string;

  @Column({ name: 'aula_especifica', nullable: true })
  aulaEspecifica: string; // Ej: "Laboratorio 2" (Sobreescribe el default del curso)
}