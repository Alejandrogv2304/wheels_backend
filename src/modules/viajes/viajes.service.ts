import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Viaje } from './entities/viajes.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ViajesService {
     private readonly logger = new Logger(ViajesService.name);
    
        constructor(
            @InjectRepository(Viaje)
            private readonly viajeRepository: Repository<Viaje>
        ){}

        async createViaje(){
            
        }
}
