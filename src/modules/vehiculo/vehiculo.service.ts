import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Vehiculo } from './entities/vehiculo.entity';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { CrearVehiculoDto } from './dto/crear-vehiculo.dto';
import { VehiculoResponse } from './types/respuesta-vehiculo';


@Injectable()
export class VehiculoService {
    private readonly logger = new Logger(VehiculoService.name);

    constructor(
        @InjectRepository(Vehiculo)
        private readonly vehiculoRepository: Repository<Vehiculo>,
        private readonly usersService: UsersService,
    ){}

    async crearVehiculo(dto: CrearVehiculoDto, usuarioId: string):Promise<VehiculoResponse> {
        this.logger.log(
          `Solicitud de creacion de vehiculo recibida para usuario ${usuarioId} con placa ${dto.placa}`,
        );

        const usuario = await this.usersService.findById(usuarioId);

        if (!usuario) {
          this.logger.warn(
            `No se pudo crear el vehiculo porque el usuario ${usuarioId} no existe`,
          );
          throw new NotFoundException('El usuario no existe');
        }

        const vehiculoExistente = await this.vehiculoRepository.findOneBy({
          placa: dto.placa,
        });

        if (vehiculoExistente) {
          this.logger.warn(
            `Intento de crear vehiculo con placa duplicada ${dto.placa}`,
          );
          throw new BadRequestException('Ya existe un vehiculo con esa placa');
        }

        const vehiculo = this.vehiculoRepository.create({
          usuarioId,
          marca: dto.marca,
          referencia: dto.referencia,
          placa: dto.placa,
          estado: true,
          tipo: dto.tipo,
          color: dto.color,
          capacidad: dto.capacidad,
        });

        try {
          const vehiculoGuardado = await this.vehiculoRepository.save(vehiculo);
          this.logger.log(
            `Vehiculo creado correctamente con id ${vehiculoGuardado.id} para usuario ${usuarioId}`,
          );
         return {
            id: vehiculoGuardado.id,
            marca: vehiculoGuardado.marca,
            referencia: vehiculoGuardado.referencia,
            placa: vehiculoGuardado.placa,
            tipo: vehiculoGuardado.tipo,
            color: vehiculoGuardado.color,
            capacidad: vehiculoGuardado.capacidad,
            fechaCreacion: vehiculoGuardado.fechaCreacion,
        };

        } catch (error) {
          const mensaje =
            error instanceof Error && error.message
              ? error.message
              : 'No se pudo crear el vehiculo';

          this.logger.error(
            `Error creando vehiculo para usuario ${usuarioId}: ${mensaje}`,
            error instanceof Error ? error.stack : undefined,
          );

          throw new BadRequestException(
            `No se pudo crear el vehiculo`,
          );
        }

    }

    async obtenerVehiculosPorUsuario(usuarioId: string): Promise<Vehiculo[]> {
    const rutas = await this.vehiculoRepository.find({
          select: {
        id: true,
        marca: true,
        referencia: true,
        tipo: true,
        color: true,
        capacidad: true,
      },  
      where: {
        usuarioId,
      }
        });
    
    return rutas;
  }
}
