import { Module } from '@nestjs/common';
import { VehiculoService } from './vehiculo.service';
import { VehiculoController } from './vehiculo.controller';

@Module({
  providers: [VehiculoService],
  controllers: [VehiculoController]
})
export class VehiculoModule {}
