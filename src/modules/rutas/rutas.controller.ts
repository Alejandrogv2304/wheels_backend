import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { CrearRutaDto } from './dto/crear-ruta.dto';
import { ActualizarRutaDto } from './dto/actualizar-ruta.dto';
import { RutasService } from './rutas.service';

@ApiTags('Rutas')
@Controller('rutas')
export class RutasController {
  constructor(private readonly rutasService: RutasService) {}
  
    @ApiOperation({ summary: 'Crear una nueva ruta' })
    @Post()
    crearRuta(
        @Body() crearRutaDto: CrearRutaDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.rutasService.crearRuta(crearRutaDto, user.id);
    }

    @ApiOperation({ summary: 'Obtener una ruta específica por su ID' })
    @Get(':id')
    obtenerRutaPorId(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
        return this.rutasService.obtenerRutaPorId(id, user.id);
    }

    @ApiOperation({ summary: 'Actualizar una ruta' })
    @Patch(':id')
    actualizarRuta(
        @Body() actualizarRutaDto: ActualizarRutaDto,
        @CurrentUser() user: AuthenticatedUser,
        @Param('id') id: string,
    ) {
        return this.rutasService.actualizarRuta(actualizarRutaDto, id, user.id);
    }

    @ApiOperation({ summary: 'Obtener todas las rutas del usuario' })
    @Get()
        obtenerTodasLasRutas(@CurrentUser() user: AuthenticatedUser) {
            return this.rutasService.obtenerTodasLasRutas(user.id);
        }

    
}
