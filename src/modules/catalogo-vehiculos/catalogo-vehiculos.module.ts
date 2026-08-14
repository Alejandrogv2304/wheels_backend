import { Module } from '@nestjs/common';
import { CatalogoVehiculosService } from './catalogo-vehiculos.service';
import { CatalogoVehiculosController } from './catalogo-vehiculos.controller';
import { CatalogoVehiculo } from './entities/catalogo.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports:[TypeOrmModule.forFeature([CatalogoVehiculo])],
  providers: [CatalogoVehiculosService],
  controllers: [CatalogoVehiculosController],
  exports: [CatalogoVehiculosService],
})
export class CatalogoVehiculosModule {}
