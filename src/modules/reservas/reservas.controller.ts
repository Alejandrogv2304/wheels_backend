import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { ReservasService } from './reservas.service';
import { ProfileCompletedGuard } from '../../common/guards/profile-completed.guard';
import { BuscarReservasQueryDto } from './dto/buscar-reservas.query.dto';

@ApiTags('Reservas')
@Controller('reservas')
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

  @Post()
  @UseGuards(ProfileCompletedGuard)
  @ApiOperation({ summary: 'Crear una reserva' })
  crearReserva(
    @Body() createReservaDto: CreateReservaDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reservasService.hacerReserva(createReservaDto, user.id);
  }

  @ApiOperation({ summary: 'Cancelar una reserva' })
  @Patch(':reservaId/cancelar')
  cancelarReserva(
    @Param('reservaId') reservaId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reservasService.cancelarReserva(reservaId, user.id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener todas las reservas de un pasajero' })
  @UseGuards(ProfileCompletedGuard)
  @Get()
  obtenerTodasLasReservas(
    @Query() query: BuscarReservasQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reservasService.obtenerReservasPorPasajeroId(user.id, query);
  }
}
