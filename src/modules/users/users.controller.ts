import { Controller,Get, HttpCode, HttpStatus } from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/common/types/authenticated-user';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('users')
export class UsersController {



    @Get('me')
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Obtener información del usuario actual' })
    me(@CurrentUser() user: AuthenticatedUser) {
        return user;
    }
}
