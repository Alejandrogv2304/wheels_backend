import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Headers,
  Post,
  Query,
} from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { RequestPasswordRecoveryDto } from './dto/request-password-recovery.dto';
import { ConfirmPasswordRecoveryDto } from './dto/confirm-password-recovery.dto';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Registrar un nuevo usuario' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Throttle({ default: { ttl: 60000, limit: 4 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión' })
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Autenticación con Google' })
  @Get('google')
  google(@Query() query: GoogleAuthDto) {
    return this.authService.googleAuth(query.redirectTo);
  }

  @Public()
  @Throttle({ default: { ttl: 60000, limit: 4 } })
  @HttpCode(HttpStatus.OK)
  @Post('password-recovery')
  @ApiOperation({ summary: 'Solicitar recuperación de contraseña' })
  requestPasswordRecovery(@Body() dto: RequestPasswordRecoveryDto) {
    return this.authService.requestPasswordRecovery(dto);
  }

  @Public()
  @Throttle({ default: { ttl: 60000, limit: 4} })
  @HttpCode(HttpStatus.OK)
  @Post('password-recovery/confirm')
  @ApiOperation({ summary: 'Crear una nueva contraseña' })
  confirmPasswordRecovery(
    @Headers('authorization') authorization: string | undefined,
    @Body() dto: ConfirmPasswordRecoveryDto,
  ) {
    const accessToken = authorization?.startsWith('Bearer ')
      ? authorization.slice(7).trim()
      : '';

    return this.authService.confirmPasswordRecovery(accessToken, dto);
  }
}
