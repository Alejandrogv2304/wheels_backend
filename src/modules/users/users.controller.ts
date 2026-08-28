import { Body, Controller, Get, HttpCode, HttpStatus, Patch } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateProfileDto } from './dto/update-profile.dto';
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
        return user;
    }

    @Patch('me')
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Actualizar el perfil del usuario actual' })
    updateMe(
      @Body() updateProfileDto: UpdateProfileDto,
      @CurrentUser() user: AuthenticatedUser,
    ) {
      return this.usersService.updateProfile(user.id, updateProfileDto);
    }
}
