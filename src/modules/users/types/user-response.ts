import {
  EstadoUsuarioEnum,
  TipoDocumentoEnum,
} from '../entities/User.entity';

export type UserMeResponse = {
  id: string;
  nombre: string | null;
  telefono: string | null;
  correo: string;
  estado: EstadoUsuarioEnum;
  tipoDocumento: TipoDocumentoEnum | null;
  numeroDocumento: string | null;
  foto: string | null;
};

export type UpdateUserProfileResponse = {
  id: string;
  nombre: string | null;
  telefono: string | null;
  correo: string;
  estado: EstadoUsuarioEnum;
  tipoDocumento: TipoDocumentoEnum | null;
  numeroDocumento: string | null;
  foto: string | null;
};
