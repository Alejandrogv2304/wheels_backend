import { Ruta } from 'src/modules/rutas/entities/rutas.entity';
import { Viaje } from 'src/modules/viajes/entities/viajes.entity';
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryColumn } from 'typeorm';

export enum EstadoUsuarioEnum {
  ACTIVO = 'activo',
  INACTIVO = 'inactivo',
}

export enum TipoDocumentoEnum {
  CC = 'cc',
  CE = 'ce',
  PASAPORTE = 'pasaporte',
  NIT = 'nit',
}

@Entity({
  name: 'usuarios',
})
export class User {
  /**
   * UUID proveniente de auth.users de Supabase.
   */
  @PrimaryColumn('uuid')
  id!: string;

  @Column({
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  nombre?: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    unique: true,
  })
  telefono?: string;

  @Column({
    type: 'varchar',
    length: 150,
    unique: true,
  })
  correo!: string;

  @Column({
    type: 'enum',
    enum: EstadoUsuarioEnum,
    default: EstadoUsuarioEnum.ACTIVO,
  })
  estado!: EstadoUsuarioEnum;

  @Column({
    name: 'tipo_documento',
    type: 'enum',
    enum: TipoDocumentoEnum,
    nullable: true,
  })
  tipoDocumento?: TipoDocumentoEnum;

  @Column({
    name: 'numero_documento',
    type: 'varchar',
    length: 50,
    nullable: true,
    unique: true,
  })
  numeroDocumento?: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  foto?: string;

  @CreateDateColumn({
    name: 'fecha_creacion',
    type: 'timestamp',
  })
  fechaCreacion!: Date;


  @OneToMany(() => Ruta, (ruta) => ruta.creador)
   rutasCreadas!: Ruta[];

  @OneToMany(() => Viaje, (viaje) => viaje.conductor)
   viajesConductor!: Viaje[];
}
