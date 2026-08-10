import {
  Check,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from '../../users/entities/User.entity';
import { Vehiculo } from '../../vehiculo/entities/vehiculo.entity';
import { Ruta } from '../../rutas/entities/rutas.entity';


export enum EstadoViaje {
  ACTIVO = 'activo',
  CANCELADO = 'cancelado',
  TERMINADO = 'terminado',
}

@Entity('viajes')
@Check('viajes_cupos_totales_check', '"cupos" > 0')
@Check('viajes_precio_check', '"precio" >= 0')
@Index('idx_viajes_fecha', ['fechaSalida'])
@Index('idx_viajes_estado', ['estado'])
@Index('idx_viajes_ruta', ['rutaId'])
@Index('idx_viajes_conductor', ['conductorId'])
export class Viaje {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'conductor_id',
    type: 'uuid',
  })
  conductorId!: string;

  @Column({
    name: 'vehiculo_id',
    type: 'uuid',
  })
  vehiculoId!: string;

  @Column({
    name: 'ruta_id',
    type: 'uuid',
  })
  rutaId!: string;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
  })
  precio!: string;

  @Column({
    type: 'int',
  })
  cupos!: number;

  @Column({
    name: 'fecha_salida',
    type: 'timestamp',
  })
  fechaSalida!: Date;

  @Column({
    type: 'text',
    nullable: true,
  })
  observaciones!: string | null;

  @Column({
    type: 'enum',
    enum: EstadoViaje,
    enumName: 'estado_viaje_enum',
    default: EstadoViaje.ACTIVO,
  })
  estado!: EstadoViaje;

  @CreateDateColumn({
    name: 'fecha_creacion',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fechaCreacion!: Date;

  @DeleteDateColumn({
    name: 'fecha_eliminacion',
    type: 'timestamp',
    nullable: true,
  })
  fechaEliminacion!: Date | null;

  @ManyToOne(() => User, (usuario) => usuario.viajesConductor, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'conductor_id',
    foreignKeyConstraintName: 'fk_viaje_conductor',
  })
  conductor!: User;

  @ManyToOne(() => Vehiculo, (vehiculo) => vehiculo.viajes, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'vehiculo_id',
    foreignKeyConstraintName: 'fk_viaje_vehiculo',
  })
  vehiculo!: Vehiculo;

  @ManyToOne(() => Ruta, (ruta) => ruta.viajes, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'ruta_id',
    foreignKeyConstraintName: 'fk_viaje_ruta',
  })
  ruta!: Ruta;
}