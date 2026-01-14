// CAMBIA EL IMPORT INICIAL POR:
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Course } from '../../academic/entities/course.entity';

@Entity('perfiles_docente')
export class TeacherProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.teacherProfile)
  @JoinColumn({ name: 'id_usuario' })
  user: User;

  @Column({ name: 'clave_empleado', unique: true })
  claveEmpleado: string;

  @Column()
  especialidad: string;

  @Column()
  telefono: string;

  @Column({ name: 'titulo_academico' })
  tituloAcademico: string; // Ej: "Licenciado", "Maestro", "Doctor"

  @Column({ nullable: true })
  ciudad: string;

  @Column({ type: 'text', nullable: true })
  direccion: string;

  @Column({ type: 'text', nullable: true })
  habilidades: string; // Puedes guardar un string largo o un JSON si prefieres

  @OneToMany(() => Course, (course) => course.teacher)
  courses: Course[];
}