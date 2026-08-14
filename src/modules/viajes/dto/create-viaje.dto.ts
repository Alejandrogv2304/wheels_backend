import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  IsDateString,
} from 'class-validator';

export class CreateViajeDto {

  @ApiProperty({ example: 'uuid-del-vehiculo' })
  @IsUUID()
  @IsNotEmpty({message: 'El ID del vehiculo es obligatorio'})
  vehiculoId!: string;

  @ApiProperty({ example: 'uuid-de-la-ruta' })
  @IsUUID()
  @IsNotEmpty({message: 'El ID de la ruta es obligatorio'})
  rutaId!: string;

  @ApiProperty({ example: 3500 })
  @IsNumber(
    {
      maxDecimalPlaces: 2,
    },
    {
      message: 'El precio debe ser un número válido',
    },
  )
  @Min(3000, {
    message: 'El precio mínimo permitido es 3000',
  })
  @Max(30000, {
    message: 'El precio máximo permitido es 30000',
  })
  precio!: number;

  @ApiProperty({ example: 4 })
  @IsInt({
    message: 'Los cupos deben ser un número entero',
  })
  @Min(1, {
    message: 'Debe existir al menos un cupo',
  })
  @Max(7, {
    message: 'El máximo de cupos permitidos es 7',
  })
  cupos!: number;

  @IsDateString(
    {},
    {
      message: 'La fecha de salida debe tener un formato ISO 8601 válido',
    },
  )
  fechaSalida!: string;

  @ApiProperty({ example: 'El viaje saldra desde la rotonda de San Francisco' })
  @IsOptional()
  @IsString({
    message: 'Las observaciones deben ser una cadena de texto',
  })
  observaciones?: string;
}