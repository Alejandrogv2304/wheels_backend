import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

const transformarNumero = (value: unknown, defaultValue: number): number => {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  const numero = Number(value);
  return Number.isNaN(numero) ? defaultValue : numero;
};

export class BuscarViajesQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Transform(({ value }) => transformarNumero(value, 1))
  @IsInt({ message: 'La página debe ser un número entero' })
  @Min(1, { message: 'La página mínima permitida es 1' })
  page = 1;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @Transform(({ value }) => transformarNumero(value, 10))
  @IsInt({ message: 'El limite debe ser un número entero' })
  @Min(1, { message: 'El limite mínimo permitido es 1' })
  limit = 10;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @Transform(({ value }) => transformarNumero(value, 0))
  @IsInt({ message: 'El skip debe ser un número entero' })
  @Min(0, { message: 'El skip mínimo permitido es 0' })
  skip = 0;

  @ApiPropertyOptional({ example: 'uis' })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value !== 'string') {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  })
  @IsString({ message: 'El texto de búsqueda debe ser una cadena' })
  @MinLength(2, {
    message: 'El texto de búsqueda debe tener al menos 2 caracteres',
  })
  q?: string;
}
