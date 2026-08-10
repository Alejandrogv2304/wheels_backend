import { Module } from '@nestjs/common';
import { RutasService } from './rutas.service';
import { RutasController } from './rutas.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ruta } from './entities/rutas.entity';
import { PuntosRutaModule } from '../puntos_ruta/puntos_ruta.module';

@Module({
  imports: [TypeOrmModule.forFeature([Ruta]), PuntosRutaModule],
  providers: [RutasService],
  controllers: [RutasController],
  exports: [RutasService],
})
export class RutasModule {}
