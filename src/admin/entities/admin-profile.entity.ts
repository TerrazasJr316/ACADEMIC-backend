import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('perfiles_admin')
export class AdminProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.adminProfile)
  @JoinColumn({ name: 'id_usuario' })
  user: User;

  @Column()
  departamento: string; // Ej: "Control Escolar", "Finanzas"

  @Column()
  puesto: string; // Ej: "Director", "Secretaria"
}