import { Module } from '@nestjs/common';
import { ViajesService } from './viajes.service';
import { ViajesController } from './viajes.controller';

@Module({
  providers: [ViajesService],
  controllers: [ViajesController]
})
export class ViajesModule {}
