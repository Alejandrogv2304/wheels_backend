import { Module } from '@nestjs/common';
import { ViajesService } from './viajes.service';
import { ViajesController } from './viajes.controller';
import { Viaje } from './entities/viajes.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehiculoModule } from '../vehiculo/vehiculo.module';
import { RutasModule } from '../rutas/rutas.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Viaje]),
    VehiculoModule,
    RutasModule,
    UsersModule,
  ],
  providers: [ViajesService],
  controllers: [ViajesController],
  exports: [ViajesService],
})
export class ViajesModule {}
