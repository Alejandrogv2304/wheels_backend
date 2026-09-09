import { EstadoReserva } from '../entities/reserva.entity';

export type cancelacionResponse = {
  id: string;
  viajeId: string;
  estado: EstadoReserva;
  fechaActualizacion: Date;
};
