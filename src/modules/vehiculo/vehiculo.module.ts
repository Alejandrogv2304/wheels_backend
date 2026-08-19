import { Module } from '@nestjs/common';
import { VehiculoService } from './vehiculo.service';
import { VehiculoController } from './vehiculo.controller';
import { Vehiculo } from './entities/vehiculo.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { Viaje } from '../viajes/entities/viajes.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Vehiculo, Viaje]),
 UsersModule],
  providers: [VehiculoService],
  controllers: [VehiculoController],
  exports: [VehiculoService],
})
export class VehiculoModule {}
