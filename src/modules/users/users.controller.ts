import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { UpdateProfileDto } from './dto/update-profile.dto';
import type { ProfilePhotoFile } from './types/profile-photo-file';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener información del usuario actual' })
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getProfile(user.id);
  }

  @Patch('me')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60 * 60 * 1000, limit: 5 } })
  @UseInterceptors(
    FileInterceptor('foto', {
      limits: {
        fileSize: 8 * 1024 * 1024,
        files: 1,
      },
    }),
  )
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nombre: { type: 'string' },
        telefono: { type: 'string' },
        tipoDocumento: { type: 'string' },
        numeroDocumento: { type: 'string' },
        foto: { type: 'string', format: 'binary' },
        eliminarFoto: { type: 'boolean' },
      },
    },
  })
  @ApiOperation({
    summary:
      'Actualizar el perfil y, opcionalmente, la foto del usuario actual',
  })
  updateMe(
    @Body() updateProfileDto: UpdateProfileDto,
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() foto?: ProfilePhotoFile,
  ) {
    return this.usersService.updateProfile(user.id, updateProfileDto, foto);
  }
}
