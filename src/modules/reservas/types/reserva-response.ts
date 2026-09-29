import { EstadoReserva } from '../entities/reserva.entity';
import { TipoVehiculo } from '../../vehiculo/entities/vehiculo.entity';

export type ReservaResponse = {
  id: string;
  viajeId: string;
  estado: EstadoReserva;
  fechaCreacion: Date;
} & {
  viaje: {
    id: string;
    precio: string;
    fechaSalida: Date;
    conductor: {
      id: string;
      nombre?: string;
      telefono?: string | null;
    };
    ruta: {
      id: string;
      nombre: string;
    };
  };
};

export type ObtenerReservasResponse = {
  reservas: ReservaResponse[];
  meta: {
    page: number;
    limit: number;
    skip: number;
    total: number;
    totalPages: number;
  };
};
