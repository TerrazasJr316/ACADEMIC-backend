import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { AcademicPeriod } from './academic-period.entity';
// Importaremos Inscripcion y Curso más abajo (relaciones circulares)

@Entity('grupos')
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => AcademicPeriod, (period) => period.groups)
  @JoinColumn({ name: 'id_ciclo' })
  period: AcademicPeriod;

  @Column()
  nombre: string; // Ej: "301-A"

  @Column({ type: 'int' })
  semestre: number;

  @Column({ name: 'limite_alumnos', type: 'int' })
  limiteAlumnos: number;
}