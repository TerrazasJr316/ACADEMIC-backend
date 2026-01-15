// CAMBIA EL IMPORT INICIAL POR:
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { StudentPayment } from '../../finance/entities/student-payment.entity';
import { Enrollment } from '../../academic/entities/enrollment.entity';

@Entity('perfiles_alumno')
export class StudentProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // RELACIÓN 1 a 1 con Usuario
  @OneToOne(() => User, (user) => user.studentProfile)
  @JoinColumn({ name: 'id_usuario' }) // FK física
  user: User;

  @Column({ name: 'matricula', unique: true })
  matricula: string;

  @Column({ length: 18, unique: true }) // CURP estándar mx
  curp: string;

  @Column({ name: 'fecha_nacimiento', type: 'date' })
  fechaNacimiento: Date;

  @Column({ length: 20 }) // "Masculino", "Femenino", "Otro"
  genero: string;

  @Column()
  telefono: string;

  @Column({ type: 'text' })
  direccion: string;

  @Column({ name: 'tipo_sangre', length: 5, nullable: true })
  tipoSangre: string;

  @Column({ name: 'grado_actual' })
  gradoActual: string; // Ej: "3er Semestre"
  
  /* QUITAR COMENTARIO CUANDO SE MODIFIQUE ESTA PARTE
  @OneToMany(() => StudentPayment, (payment) => payment.student)
  payments: StudentPayment[];
  */

  @OneToMany(() => Enrollment, (enrollment) => enrollment.student)
  enrollments: Enrollment[];
}