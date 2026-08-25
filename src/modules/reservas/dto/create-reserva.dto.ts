import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateReservaDto {
  @ApiProperty({ example: 'uuid-del-viaje' })
  @IsUUID('4', { message: 'El ID del viaje debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El ID del viaje es obligatorio' })
  viajeId!: string;
}
