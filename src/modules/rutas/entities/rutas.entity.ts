import {
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from '../../users/entities/User.entity';
import { PuntoRuta } from '../../puntos_ruta/entities/punto-ruta.entity';
import { Viaje } from '../../viajes/entities/viajes.entity';


export enum EstadoRuta {
  ACTIVA = 'activa',
  INACTIVA = 'inactiva',
}

@Entity('rutas')
@Index('idx_rutas_creador', ['creadorId'])
@Index('idx_rutas_estado', ['estado'])
export class Ruta {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'creador_id',
    type: 'uuid',
  })
  creadorId!: string;

  @Column({
    type: 'varchar',
    length: 150,
  })
  nombre!: string;

  @Column({
    type: 'enum',
    enum: EstadoRuta,
    enumName: 'estado_ruta_enum',
    default: EstadoRuta.ACTIVA,
  })
  estado!: EstadoRuta;

  @DeleteDateColumn({
    name: 'fecha_eliminacion',
    type: 'timestamp',
    nullable: true,
  })
  fechaEliminacion!: Date | null;

  @ManyToOne(() => User, (usuario) => usuario.rutasCreadas, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'creador_id',
    foreignKeyConstraintName: 'fk_ruta_creador',
  })
  creador!: User;

  @OneToMany(() => PuntoRuta, (punto) => punto.ruta)
  puntos!: PuntoRuta[];

  @OneToMany(() => Viaje, (viaje) => viaje.ruta)
  viajes!: Viaje[];
}