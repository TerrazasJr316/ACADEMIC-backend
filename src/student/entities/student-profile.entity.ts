import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('perfiles_alumno')
export class StudentProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.studentProfile)
  @JoinColumn({ name: 'id_usuario' })
  user: User;

  @Column({ name: 'matricula', unique: true })
  matricula: string;

  @Column({ name: 'nombre_completo', length: 150, nullable: true })
  nombreCompleto: string;

  @Column({ length: 18, unique: true, nullable: true })
  curp: string;

  @Column({ name: 'fecha_nacimiento', type: 'date' })
  fechaNacimiento: Date;

  @Column({ length: 20 })
  genero: string;

  @Column()
  telefono: string;

  @Column({ type: 'text' })
  direccion: string;

  @Column({ name: 'tipo_sangre', length: 5, nullable: true })
  tipoSangre: string;

  @Column({ name: 'grado_actual' })
  gradoActual: string;
}