import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservasService } from './reservas.service';
import { ReservasController } from './reservas.controller';
import { Reserva } from './entities/reserva.entity';
import { Viaje } from '../viajes/entities/viajes.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Reserva, Viaje])],
  providers: [ReservasService],
  controllers: [ReservasController],
  exports: [ReservasService],
})
export class ReservasModule {}
