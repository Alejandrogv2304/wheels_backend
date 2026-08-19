import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { CreateViajeDto } from './dto/create-viaje.dto';
import { ViajesService } from './viajes.service';
import { BuscarViajesQueryDto } from './dto/buscar-viajes.query.dto';

@ApiTags('Viajes')
@Controller('viajes')
export class ViajesController {
  constructor(private readonly viajesService: ViajesService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un viaje' })
  @Post()
  crearViaje(
    @Body() createViajeDto: CreateViajeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.viajesService.createViaje(createViajeDto, user.id);
  }

  @ApiOperation({ summary: 'Obtener viajes por conductor' })
  @Get('conductor/:conductorId')
  obtenerViajesPorConductorId(@Query('conductorId') conductorId: string) {
    return this.viajesService.obtenerViajePorConductorId(conductorId);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener viajes disponibles' })
  @Get()
  obtenerTodosLosViajes(@Query() query: BuscarViajesQueryDto) {
    return this.viajesService.obtenerTodosLosViajes(query);
  }

  
}
