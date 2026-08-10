import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({example:'correo123@correo.com'})
  @IsEmail({}, {message:'El correo debe ser un correo valido'})
  @IsNotEmpty({message:'El correo es obligatorio'})
  email!: string;

  @ApiProperty({example:'password1234' , minLength:8})
  @IsString()
  @IsNotEmpty({message:'La contraseña es obligatoria'})
  @MinLength(8, {message:'La contraseña debe tener al menos 8 caracteres'})
  password!: string;

  @ApiProperty({example:'3147185092'})
  @IsString({message:'El telefono debe ser un string'})
  @IsNotEmpty({message:'El telefono es obligatorio'})
  @Matches(/^(\+57)?3\d{9}$/, {
    message:
      'El telefono debe ser un celular colombiano válido, por ejemplo 3147185092 o +573147185092',
  })
  phone!: string;

  @ApiProperty({example:'Alejandro Gomez'})
  @IsOptional()
  @IsString()
  name?: string;
}
