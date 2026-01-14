import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { School } from '../../tenants/entities/school.entity';

@Entity('materias')
export class Subject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => School)
  @JoinColumn({ name: 'id_escuela' })
  school: School;

  @Column()
  nombre: string; // Ej: "Matemáticas I"

  @Column({ name: 'codigo_materia' })
  codigoMateria: string; // Ej: "MAT-101"

  @Column({ type: 'int' })
  creditos: number;
}