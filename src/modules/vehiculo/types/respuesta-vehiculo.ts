import { TipoVehiculo } from "../entities/vehiculo.entity";

export type VehiculoResponse = {
  id: string;
  marca: string;
  referencia: string;
  placa: string;
  tipo: TipoVehiculo;
  color: string | null;
  capacidad: number;
  fechaCreacion: Date;
};