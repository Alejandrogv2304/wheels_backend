import { Module } from '@nestjs/common';
import { PuntosRutaController } from './puntos_ruta.controller';
import { PuntosRutaService } from './puntos_ruta.service';
import { PuntoRuta } from './entities/punto-ruta.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports:[TypeOrmModule.forFeature([PuntoRuta])],
  controllers: [PuntosRutaController],
  providers: [PuntosRutaService],
  exports: [PuntosRutaService],
})
export class PuntosRutaModule {}
