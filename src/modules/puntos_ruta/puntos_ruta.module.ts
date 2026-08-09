import { Module } from '@nestjs/common';
import { PuntosRutaController } from './puntos_ruta.controller';
import { PuntosRutaService } from './puntos_ruta.service';

@Module({
  controllers: [PuntosRutaController],
  providers: [PuntosRutaService]
})
export class PuntosRutaModule {}
