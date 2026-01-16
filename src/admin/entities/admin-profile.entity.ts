import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('perfiles_admin')
export class AdminProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ⚠️ AJUSTE: Quitamos la segunda parte temporalmente para evitar errores 
  // si el archivo del Líder (User) no tiene la propiedad 'adminProfile'.
  // Con { onDelete: 'CASCADE' } aseguramos que si borran al User, se borra este perfil.
  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_usuario' })
  user: User;

  @Column({ default: 'Dirección General' }) // Valor por defecto por si acaso
  departamento: string; 

  @Column({ default: 'Director' })
  puesto: string;
}