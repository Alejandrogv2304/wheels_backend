import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';


export class CrearViajeDto {
  @ApiProperty({ example: 'Bucaramanga - UIS' })
  @IsString({ message: 'El nombre de la ruta debe ser un texto' })
  @MinLength(3, { message: 'El nombre de la ruta debe tener al menos 3 caracteres' })
  nombre!: string;

  @ApiProperty({ example: false, required: false, default: false })
  @IsOptional()
  @IsBoolean({ message: 'favorita debe ser un valor booleano' })
  favorita?: boolean = false;

 
}