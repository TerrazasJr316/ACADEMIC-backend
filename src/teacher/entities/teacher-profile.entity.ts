import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
// Asegúrate de que esta ruta sea correcta según tu estructura de carpetas
import { Course } from '../../academic/entities/course.entity';

@Entity('perfiles_docente')
export class TeacherProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.teacherProfile)
  @JoinColumn({ name: 'id_usuario' })
  user: User;

  @Column({ name: 'clave_empleado', unique: true, nullable: true }) 
  // Puse nullable: true por seguridad si ya tienes datos, si limpiaste la BD quítale el nullable
  claveEmpleado: string;

  @Column({ nullable: true })
  especialidad: string;

  @Column({ nullable: true })
  telefono: string;

  @Column({ name: 'titulo_academico', nullable: true })
  tituloAcademico: string; // Ej: "Licenciado", "Maestro"

  @Column({ nullable: true })
  ciudad: string;

  @Column({ type: 'text', nullable: true })
  direccion: string;

  @Column({ type: 'text', nullable: true })
  habilidades: string;

  // Relación inversa: Un profe tiene muchos cursos
  @OneToMany(() => Course, (course) => course.teacher)
  courses: Course[];
}
