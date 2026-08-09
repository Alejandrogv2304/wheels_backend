import {
  Check,
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Ruta } from '../../rutas/entities/rutas.entity';

@Entity('puntos_ruta')
@Check('puntos_ruta_orden_check', '"orden" > 0')
@Index('idx_puntos_ruta_orden', ['rutaId', 'orden'])
export class PuntoRuta {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'ruta_id',
    type: 'uuid',
  })
  rutaId!: string;

  @Column({
    type: 'varchar',
    length: 150,
  })
  nombre!: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  direccion!: string | null;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 8,
  })
  latitud!: string;

  @Column({
    type: 'numeric',
    precision: 11,
    scale: 8,
  })
  longitud!: string;

  @Column({
    type: 'int',
  })
  orden!: number;

  @DeleteDateColumn({
    name: 'fecha_eliminacion',
    type: 'timestamp',
    nullable: true,
  })
  fechaEliminacion!: Date | null;

  @ManyToOne(() => Ruta, (ruta) => ruta.puntos, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'ruta_id',
    foreignKeyConstraintName: 'fk_punto_ruta',
  })
  ruta!: Ruta;
}