import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';

export class ActualizarPuntoRutaDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', required: false })
  @IsOptional()
  @IsUUID('4', { message: 'El id del punto debe ser un UUID valido' })
  id?: string;

  @ApiProperty({ example: 'Cabecera' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'El nombre del punto debe ser un texto' })
  @MinLength(1, { message: 'El nombre del punto es obligatorio' })
  nombre!: string;

  @ApiProperty({ example: 'Carrera 33', required: false })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === null) {
      return null;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed || null;
    }

    return value;
  })
  @IsString({ message: 'La direccion debe ser un texto' })
  direccion?: string | null;

  @ApiProperty({ example: 7.11934982 })
  @IsOptional()
  @Transform(({ value }) =>
    value === '' || value === null || value === undefined ? undefined : value,
  )
  @Type(() => Number)
  @IsNumber({}, { message: 'La latitud debe ser un numero valido' })
  latitud?: number;

  @ApiProperty({ example: -73.12274123 })
  @IsOptional()
  @Transform(({ value }) =>
    value === '' || value === null || value === undefined ? undefined : value,
  )
  @Type(() => Number)
  @IsNumber({}, { message: 'La longitud debe ser un numero valido' })
  longitud?: number;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt({ message: 'El orden debe ser un numero entero' })
  @Min(1, { message: 'El orden debe ser mayor o igual a 1' })
  orden!: number;
}
