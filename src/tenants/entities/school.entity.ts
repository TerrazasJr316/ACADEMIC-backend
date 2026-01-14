import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { PlanSuscripcion } from '../../shared/enums/subscription-plan.enum';
import { User } from '../../users/entities/user.entity';

@Entity('escuelas') // Nombre real de la tabla en PostgreSQL
export class School {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'nombre_escuela', type: 'text' })
  nombreEscuela: string;

  // El dominio debe ser único para identificar al tenant (ej. tesji.com)
  @Column({ name: 'dominio_escuela', type: 'text', unique: true })
  dominioEscuela: string;

  @Column({ name: 'correo_contacto', type: 'text' })
  correoContacto: string;
    
  @Column({
    name: 'plan_suscripcion',
    type: 'enum',
    enum: PlanSuscripcion,
    default: PlanSuscripcion.BASIC
  })
  planSuscripcion: PlanSuscripcion;

  @Column({ name: 'esta_activa', type: 'boolean', default: true })
  estaActiva: boolean;

  // Se llena automática al crear el registro
  @CreateDateColumn({ name: 'fecha_registro' })
  fechaRegistro: Date;

  // Opcional pero recomendado: Saber cuándo fue la última edición
  @UpdateDateColumn({ name: 'fecha_actualizacion', select: false })
  updatedAt: Date;

  @OneToMany(() => User, (user) => user.school)
  users: User[];
}