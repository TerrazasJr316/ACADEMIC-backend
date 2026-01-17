// src/student/entities/student-profile.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
//import { StudentPayment } from '../../finance/entities/student-payment.entity'; // 👈 YA DESCOMENTADO
//import { Enrollment } from '../../academic/entities/enrollment.entity'; // 👈 YA DESCOMENTADO

@Entity('perfiles_alumno')
export class StudentProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // RELACIÓN 1 a 1 con Usuario
  @OneToOne(() => User, (user) => user.studentProfile)
  @JoinColumn({ name: 'id_usuario' })
  user: User;

  @Column({ name: 'matricula', unique: true })
  matricula: string;

  // 👇 ESTA ES LA NUEVA COLUMNA QUE NECESITAS PARA EL NOMBRE 👇
  @Column({ name: 'nombre_completo', length: 150, nullable: true })
  nombreCompleto: string;
  // 👆 FIN DE LO NUEVO 👆

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
  gradoActual: string; 

  // 👇 RELACIONES NECESARIAS PARA QUE EL ADMIN.SERVICE NO FALLE 👇
  /*
  @OneToMany(() => StudentPayment, (payment) => payment.student)
  payments: StudentPayment[];

  @OneToMany(() => Enrollment, (enrollment) => enrollment.student)
  enrollments: Enrollment[];
  */
}