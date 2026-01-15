import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('mensajes_internos')
export class InternalMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // QUIEN ENVÍA
  @ManyToOne(() => User)
  @JoinColumn({ name: 'id_remitente' })
  remitente: User;

  // QUIEN RECIBE
  @ManyToOne(() => User)
  @JoinColumn({ name: 'id_destinatario' })
  destinatario: User;

  @Column()
  asunto: string;

  @Column({ name: 'cuerpo_mensaje', type: 'text' })
  cuerpoMensaje: string;

  @Column({ name: 'url_adjunto', nullable: true })
  urlAdjunto: string;

  @Column({ default: false })
  leido: boolean;

  @CreateDateColumn({ name: 'fecha_envio' })
  fechaEnvio: Date;
}