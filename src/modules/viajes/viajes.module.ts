import { Module } from '@nestjs/common';
import { ViajesService } from './viajes.service';
import { ViajesController } from './viajes.controller';
import { Viaje } from './entities/viajes.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Viaje])],
  providers: [ViajesService],
  controllers: [ViajesController],
  exports: [ViajesService],
})
export class ViajesModule {}
