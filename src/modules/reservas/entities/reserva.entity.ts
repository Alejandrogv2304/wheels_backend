import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from '../../users/entities/User.entity';
import { Viaje } from '../../viajes/entities/viajes.entity';

export enum EstadoReserva {
  PENDIENTE = 'pendiente',
  CONFIRMADA = 'confirmada',
  FINALIZADA = 'finalizada',
  CANCELADA = 'cancelada',
}

@Entity('reservas')
@Index('idx_reservas_pasajero_viaje_unique', ['pasajeroId', 'viajeId'], {
  unique: true,
  where: '"estado" <> \'cancelada\'',
})
@Index('idx_reservas_viaje', ['viajeId'])
@Index('idx_reservas_pasajero', ['pasajeroId'])
export class Reserva {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'pasajero_id',
    type: 'uuid',
  })
  pasajeroId!: string;

  @Column({
    name: 'viaje_id',
    type: 'uuid',
  })
  viajeId!: string;

  @Column({
    type: 'enum',
    enum: EstadoReserva,
    enumName: 'estado_reserva_enum',
    default: EstadoReserva.PENDIENTE,
  })
  estado!: EstadoReserva;

  @CreateDateColumn({
    name: 'fecha_creacion',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fechaCreacion!: Date;

  /*
   * Esta columna es actualizada en PostgreSQL mediante el trigger:
   *
   * trg_actualizar_reserva
   *   BEFORE UPDATE ON reservas
   *   EXECUTE FUNCTION actualizar_fecha_actualizacion();
   *
   * Por eso se utiliza @Column en lugar de @UpdateDateColumn para evitar
   * duplicar la responsabilidad entre TypeORM y la base de datos.
   */
  @Column({
    name: 'fecha_actualizacion',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fechaActualizacion?: Date;

  @ManyToOne(() => User, (usuario) => usuario.reservas, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'pasajero_id',
    referencedColumnName: 'id',
  })
  pasajero!: User;

  @ManyToOne(() => Viaje, (viaje) => viaje.reservas, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'viaje_id',
    referencedColumnName: 'id',
  })
  viaje!: Viaje;
}
