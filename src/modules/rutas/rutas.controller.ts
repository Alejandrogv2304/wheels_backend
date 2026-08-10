import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { CrearRutaDto } from './dto/crear-ruta.dto';
import { RutasService } from './rutas.service';

@ApiTags('Rutas')
@Controller('rutas')
export class RutasController {
  constructor(private readonly rutasService: RutasService) {}

  @Post()
  crearRuta(
    @Body() crearRutaDto: CrearRutaDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.rutasService.crearRuta(crearRutaDto, user.id);
  }
}
