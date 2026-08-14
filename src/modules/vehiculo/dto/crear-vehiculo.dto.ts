import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { TipoVehiculo } from '../entities/vehiculo.entity';

export class CrearVehiculoDto {
  @ApiProperty({ example: 'Toyota' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'La marca debe ser un texto' })
  @IsNotEmpty({ message: 'La marca es obligatoria' })
  @MinLength(1, { message: 'La marca es obligatoria' })
  marca!: string;

  @ApiProperty({ example: 'Corolla' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'El modelo debe ser un texto' })
  @IsNotEmpty({ message: 'El modelo es obligatorio' })
  @MinLength(1, { message: 'El modelo es obligatorio' })
  referencia!: string;

  @ApiProperty({ example: 'ABC123' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString({ message: 'La placa debe ser un texto' })
  @IsNotEmpty({ message: 'La placa es obligatoria' })
  @Matches(/^([A-Z]{3}\d{3}|[A-Z]{3}\d{2}[A-Z])$/, {
    message:
      'La placa debe tener un formato colombiano valido, por ejemplo ABC123 o ABC12D',
  })
  placa!: string;


  @ApiProperty({ example: TipoVehiculo.CARRO, enum: TipoVehiculo })
  @IsEnum(TipoVehiculo, {
    message: 'El tipo debe ser carro o moto',
  })
  tipo!: TipoVehiculo;

  @ApiProperty({ example: 'Rojo' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'El color debe ser un texto' })
  @IsNotEmpty({ message: 'El color es obligatorio' })
  @MinLength(1, { message: 'El color es obligatorio' })
  color!: string;

  @ApiProperty({ example: 4 })
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() !== '' ? Number(value) : value,
  )
  @IsInt({ message: 'La capacidad debe ser un numero entero' })
  @Min(1, { message: 'La capacidad debe ser al menos 1' })
  @Max(7, { message: 'La capacidad no puede ser mayor a 7' })
  capacidad!: number;
}
