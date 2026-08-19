import { Viaje } from "../entities/viajes.entity";
import { TipoVehiculo } from "../../vehiculo/entities/vehiculo.entity";

export type ObtenerViajesResponse = {
  viajes: ViajeListado[];
  meta: {
    page: number;
    limit: number;
    skip: number;
    total: number;
    totalPages: number;
  };
};

export type ViajeResponse = Pick<
  Viaje,
  | 'id'
  | 'conductorId'
  | 'vehiculoId'
  | 'rutaId'
  | 'precio'
  | 'cupos'
  | 'fechaSalida'
  | 'observaciones'
  | 'estado'
  | 'fechaCreacion'
>;

export type ViajeConRutaYPuntos = Pick<
  Viaje,
  | 'id'
  | 'conductorId'
  | 'vehiculoId'
  | 'rutaId'
  | 'precio'
  | 'cupos'
  | 'fechaSalida'
  | 'observaciones'
  | 'estado'
  | 'fechaCreacion'
> & {
  ruta: {
    id: string;
    nombre: string;
    favorita: boolean;
    puntos: Array<{
      id: string;
      nombre: string;
      direccion: string | null;
      latitud: string | null;
      longitud: string | null;
      orden: number;
    }>;
  };
};

export type ViajeListado = Pick<
  Viaje,
  | 'id'
  | 'conductorId'
  | 'vehiculoId'
  | 'rutaId'
  | 'precio'
  | 'cupos'
  | 'fechaSalida'
  | 'observaciones'
> & {
  ruta: {
    id: string;
    nombre: string;
  };
  vehiculo: {
    id: string;
    marca: string;
    referencia: string;
    tipo: TipoVehiculo;
  };
};
