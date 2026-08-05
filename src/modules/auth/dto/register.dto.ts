import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
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

  @IsOptional()
  @IsString()
  name?: string;
}
