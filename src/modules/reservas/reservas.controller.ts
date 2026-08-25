import { Body, Controller, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { ReservasService } from './reservas.service';

@ApiTags('Reservas')
@Controller('reservas')
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

  @Post()
  crearReserva(
    @Body() createReservaDto: CreateReservaDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reservasService.hacerReserva(createReservaDto, user.id);
  }

  @Patch(':reservaId/cancelar')
  cancelarReserva(
    @Param('reservaId') reservaId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reservasService.cancelarReserva(reservaId, user.id);
  }
}
