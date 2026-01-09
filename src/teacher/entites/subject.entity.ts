import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('subjects') // Nombre de la tabla en la base de datos
export class Subject {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column()
  clave: string;

  @Column({ nullable: true })
  salon: string;

  @Column('json', { nullable: true })
  horarios: { dia: string; hora_inicio: string; hora_fin: string }[];

  // Aquí podrías agregar más campos después, como el ID del docente
  @Column({ nullable: true })
  teacherId: string;
}
