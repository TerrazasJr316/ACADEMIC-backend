import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { School } from '../../tenants/entities/school.entity';

@Entity('catalogo_tramites')
export class TransactionCatalog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // RELACIÓN: Muchos trámites -> Una Escuela
  @ManyToOne(() => School)
  @JoinColumn({ name: 'id_escuela' })
  school: School;

  @Column({ name: 'nombre_tramite' })
  nombreTramite: string; // Ej: "Constancia de Estudios", "Examen Extraordinario"

  // IMPORTANTE: Para dinero siempre usa decimal (precision, scale)
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'costo' })
  costo: number; // Ej: 150.00
}