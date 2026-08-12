import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { VehiculoService } from './vehiculo.service';
import { CrearVehiculoDto } from './dto/crear-vehiculo.dto';
import type { AuthenticatedUser } from 'src/common/types/authenticated-user';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@ApiTags('Vehículo')
@Controller('vehiculo')
export class VehiculoController {
    constructor(
         private readonly vehiculoService: VehiculoService
    ){}

    @ApiOperation({ summary: 'Crear un vehículo' })
    @Post('')
    crearVehiculo(
      @Body() crearVehiculoDto: CrearVehiculoDto,
      @CurrentUser() user: AuthenticatedUser,
    ) {
      return this.vehiculoService.crearVehiculo(crearVehiculoDto, user.id);
    }
}
