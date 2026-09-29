import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ConfirmPasswordRecoveryDto {
  @ApiProperty({ example: 'NuevaPassword123', minLength: 8 })
  @IsString({ message: 'La contraseña debe ser una cadena' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password!: string;
}
