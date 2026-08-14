import {
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { TipoVehiculo } from '../entities/catalogo.entity';

export class CreateCatalogoVehiculoDto {
  @ApiProperty({ example: 'Toyota' })
  @IsString({ message: 'La marca debe ser un texto' })
  @IsNotEmpty({ message: 'La marca es obligatoria' })
  @MaxLength(100)
  marca!: string;

  @ApiProperty({ example: 'Corolla' })
  @IsString({ message: 'La referencia debe ser un texto' })
  @IsNotEmpty({ message: 'La referencia es obligatoria' })
  @MaxLength(100)
  referencia!: string;


  @ApiProperty({ example: 'Automovil' })
  @IsEnum(TipoVehiculo, {
    message: `El tipo debe ser uno de los siguientes valores: ${Object.values(
      TipoVehiculo,
    ).join(', ')}`,
  })
  tipo!: TipoVehiculo;
}