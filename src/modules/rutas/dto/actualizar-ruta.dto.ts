import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsArray,
  IsOptional,
  IsString,
  ValidateNested,
  MinLength,
} from 'class-validator';
import { ActualizarPuntoRutaDto } from './actualizar-punto-ruta.dto';

export class ActualizarRutaDto {
  @ApiProperty({ example: 'Bucaramanga - UIS', required: false })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'El nombre de la ruta debe ser un texto' })
  @MinLength(3, {
    message: 'El nombre de la ruta debe tener al menos 3 caracteres',
  })
  nombre?: string;

  @ApiProperty({ example: false, required: false, default: false })
  @IsOptional()
  @IsBoolean({ message: 'favorita debe ser un valor booleano' })
  favorita?: boolean;

  @ApiProperty({ type: [ActualizarPuntoRutaDto] })
  @IsArray({ message: 'puntos debe ser un arreglo' })
  @ValidateNested({ each: true })
  @Type(() => ActualizarPuntoRutaDto)
  puntos!: ActualizarPuntoRutaDto[];
}
