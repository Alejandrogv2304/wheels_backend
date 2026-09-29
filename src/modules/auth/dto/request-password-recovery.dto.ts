import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class RequestPasswordRecoveryDto {
  @ApiProperty({ example: 'usuario@example.com' })
  @IsEmail({}, { message: 'El correo debe ser un correo válido' })
  @IsNotEmpty({ message: 'El correo es obligatorio' })
  email!: string;
}
