import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CrearPuntoRutaDto {
  @ApiProperty({ example: 'Cabecera' })
  @IsString({ message: 'El nombre del punto debe ser un texto' })
  @MinLength(1, { message: 'El nombre del punto es obligatorio' })
  nombre!: string;

  @ApiProperty({ example: 'Carrera 33', required: false })
  @IsOptional()
  @IsString({ message: 'La direccion debe ser un texto' })
  direccion?: string;

  @ApiProperty({ example: 7.11934982 })
  @Type(() => Number)
  @IsNumber({}, { message: 'La latitud debe ser un numero valido' })
  latitud!: number;

  @ApiProperty({ example: -73.12274123 })
  @Type(() => Number)
  @IsNumber({}, { message: 'La longitud debe ser un numero valido' })
  longitud!: number;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt({ message: 'El orden debe ser un numero entero' })
  @Min(1, { message: 'El orden debe ser mayor o igual a 1' })
  orden!: number;
}
