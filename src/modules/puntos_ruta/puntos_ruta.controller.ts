import { Controller, Delete, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PuntosRutaService } from './puntos_ruta.service';
import type { AuthenticatedUser } from 'src/common/types/authenticated-user';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@ApiTags('Puntos de Ruta')
@Controller('puntos-ruta')
export class PuntosRutaController {
    constructor(private readonly puntosRutaService: PuntosRutaService) {}

    @Delete(':id')
    async eliminarPuntoRuta(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
       
        return this.puntosRutaService.eliminarPuntoRuta(id, user.id);
    }
}
