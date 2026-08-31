/** Campos de Multer que necesita el flujo de fotos de perfil. */
export interface ProfilePhotoFile {
  buffer: Buffer;
  mimetype: string;
  size: number;
}
