import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  Equals,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { TipoDocumentoEnum } from '../entities/User.entity';

const trimValue = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const nullValue = ({ value }: { value: unknown }) =>
  value === 'null' ? null : value;

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Alejandro Gomez' })
  @IsOptional()
  @Transform(trimValue)
  @IsString({ message: 'El nombre debe ser un texto' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(120, { message: 'El nombre no puede superar 120 caracteres' })
  nombre?: string;

  @ApiPropertyOptional({ example: '3147185092' })
  @IsOptional()
  @Transform(trimValue)
  @Matches(/^((\+57)?3\d{9})$/, {
    message:
      'El telefono debe ser un celular colombiano válido, por ejemplo 3147185092 o +573147185092',
  })
  telefono?: string;

  @ApiPropertyOptional({
    enum: TipoDocumentoEnum,
    example: TipoDocumentoEnum.CC,
  })
  @IsOptional()
  @IsEnum(TipoDocumentoEnum, {
    message: 'El tipo de documento no es válido',
  })
  tipoDocumento?: TipoDocumentoEnum;

  @ApiPropertyOptional({ example: '1098765432' })
  @IsOptional()
  @Transform(trimValue)
  @IsString({ message: 'El numero de documento debe ser un texto' })
  @MinLength(3, {
    message: 'El numero de documento debe tener al menos 3 caracteres',
  })
  @MaxLength(50, {
    message: 'El numero de documento no puede superar 50 caracteres',
  })
  numeroDocumento?: string;

  @ApiPropertyOptional({
    nullable: true,
    description:
      'Enviar null para eliminar la foto actual. No acepta rutas ni URLs.',
  })
  @IsOptional()
  @Transform(nullValue)
  @Equals(null, { message: 'La foto solo puede enviarse como null' })
  foto?: null;

  @ApiPropertyOptional({
    example: true,
    description:
      'Alternativa para multipart/form-data: true elimina la foto actual.',
  })
  @IsOptional()
  @Transform(
    ({ value }: { value: unknown }) => value === true || value === 'true',
  )
  @IsBoolean({ message: 'eliminarFoto debe ser un booleano' })
  eliminarFoto?: boolean;
}
