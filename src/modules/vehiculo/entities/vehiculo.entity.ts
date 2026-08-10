import {
  Check,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from '../../users/entities/User.entity';
import { Viaje } from 'src/modules/viajes/entities/viajes.entity';


export enum TipoVehiculo {
  CARRO = 'carro',
  MOTO = 'moto',
}

@Entity('vehiculos')
@Check('CHK_vehiculos_capacidad', '"capacidad" > 0')
export class Vehiculo {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'usuario_id', type: 'uuid' })
  usuarioId!: string;

  @ManyToOne(() => User, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'usuario_id' })
  usuario!: User;

  @Column({
    type: 'varchar',
    length: 100,
  })
  modelo!: string;

  @Column({
    type: 'varchar',
    length: 100,
  })
  marca!: string;

  @Column({
    type: 'varchar',
    length: 20,
    unique: true,
  })
  placa!: string;

  @Column({
    type: 'boolean',
    default: true,
  })
  estado!: boolean;

  @Column({
    type: 'enum',
    enum: TipoVehiculo,
    enumName: 'tipo_vehiculo_enum',
  })
  tipo!: TipoVehiculo;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  color!: string | null;

  @Column({
    type: 'int',
  })
  capacidad!: number;

  @CreateDateColumn({
    name: 'fecha_creacion',
    type: 'timestamp',
  })
  fechaCreacion!: Date;

  @DeleteDateColumn({
    name: 'fecha_eliminacion',
    type: 'timestamp',
    nullable: true,
  })
  fechaEliminacion!: Date | null;

  @OneToMany(() => Viaje, (viaje) => viaje.vehiculo)
  viajes!: Viaje[];
}