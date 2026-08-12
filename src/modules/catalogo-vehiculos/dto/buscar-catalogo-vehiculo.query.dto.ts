import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { TipoVehiculo } from '../entities/catalogo.entity';

export class BuscarCatalogoVehiculoQueryDto {
  @ApiPropertyOptional({ enum: TipoVehiculo, example: TipoVehiculo.AUTOMOVIL })
  @IsOptional()
  @IsEnum(TipoVehiculo, {
    message: 'El tipo debe ser automovil o moto',
  })
  tipo?: TipoVehiculo;

  @ApiPropertyOptional({ example: 'toyota' })
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
