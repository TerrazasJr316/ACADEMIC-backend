// src/student/entities/student-profile.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
// import { StudentPayment } from '../../finance/entities/student-payment.entity'; // 🚧 PENDIENTE
// import { Enrollment } from '../../academic/entities/enrollment.entity'; // 🚧 PENDIENTE

@Entity('perfiles_alumno')
export class StudentProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // RELACIÓN 1 a 1 con Usuario (ESTA ES LA IMPORTANTE)
  @OneToOne(() => User, (user) => user.studentProfile)
  @JoinColumn({ name: 'id_usuario' })
  user: User;

  @Column({ name: 'matricula', unique: true })
  matricula: string;

  @Column({ length: 18, unique: true })
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
<<<<<<< HEAD
  gradoActual: string; // Ej: "3er Semestre"

  /* QUITAR COMENTARIO CUANDO SE MODIFIQUE ESTA PARTE
=======
  gradoActual: string;

  // 🚧 RELACIONES FUTURAS (Descomentar en FASE 4)
  /*
>>>>>>> 69312ab4c44766b79408286a91d02476538e2950
  @OneToMany(() => StudentPayment, (payment) => payment.student)
  payments: StudentPayment[];

  @OneToMany(() => Enrollment, (enrollment) => enrollment.student)
  enrollments: Enrollment[];
  */
}