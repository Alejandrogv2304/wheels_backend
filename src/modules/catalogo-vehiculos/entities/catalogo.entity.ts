import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

export enum TipoVehiculo {
  AUTOMOVIL = 'automovil',
  MOTO = 'moto',
}

@Entity('catalogo_vehiculos')
@Unique('UQ_catalogo_vehiculo_marca_modelo', ['marca', 'referencia'])
export class CatalogoVehiculo {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'varchar',
    length: 100,
  })
  marca!: string;

  @Column({
    type: 'varchar',
    length: 100,
  })
  referencia!: string;

  @Column({
    type: 'enum',
    enum: TipoVehiculo,
    enumName: 'tipo_catalogo_vehiculo_enum',
  })
  tipo!: TipoVehiculo;

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
}