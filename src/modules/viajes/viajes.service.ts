import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Viaje } from './entities/viajes.entity';
import { Brackets, Repository } from 'typeorm';
import { CreateViajeDto } from './dto/create-viaje.dto';
import { VehiculoService } from '../vehiculo/vehiculo.service';
import { RutasService } from '../rutas/rutas.service';
import { EstadoViaje } from './entities/viajes.entity';
import { BuscarViajesQueryDto } from './dto/buscar-viajes.query.dto';
import {
  ViajeResponse,
  type ObtenerViajesResponse,
  type ViajeConRutaYPuntos,
  type ViajeListado,
} from './types/viajes-response';



@Injectable()
export class ViajesService {
     private readonly logger = new Logger(ViajesService.name);
    
        constructor(
            @InjectRepository(Viaje)
            private readonly viajeRepository: Repository<Viaje>,
            private readonly vehiculoService: VehiculoService,
            private readonly rutasService: RutasService,
        ){}

        async createViaje(
          dto: CreateViajeDto,
          conductorId: string,
        ): Promise<ViajeResponse> {
          this.logger.log(
            `Solicitud de creacion de viaje recibida para conductor ${conductorId} con vehiculo ${dto.vehiculoId} y ruta ${dto.rutaId}`,
          );

          const fechaSalida = new Date(dto.fechaSalida);

          if (Number.isNaN(fechaSalida.getTime())) {
            throw new BadRequestException(
              'La fecha de salida no tiene un formato valido',
            );
          }

          if (fechaSalida.getTime() < Date.now()) {
            throw new BadRequestException(
              'La fecha de salida no puede ser anterior a la actual',
            );
          }

          await this.vehiculoService.validarVehiculoPerteneceAConductor(
            dto.vehiculoId,
            conductorId,
          );

          await this.rutasService.validarRutaPerteneceAConductor(
            dto.rutaId,
            conductorId,
          );

          const viaje = this.viajeRepository.create({
            conductorId,
            vehiculoId: dto.vehiculoId,
            rutaId: dto.rutaId,
            precio: dto.precio.toString(),
            cupos: dto.cupos,
            fechaSalida,
            observaciones: dto.observaciones ?? null,
            estado: EstadoViaje.ACTIVO,
          });

          try {
            const viajeGuardado = await this.viajeRepository.save(viaje);

            this.logger.log(
              `Viaje creado correctamente con id ${viajeGuardado.id} para conductor ${conductorId}`,
            );

            return {
              id: viajeGuardado.id,
              conductorId: viajeGuardado.conductorId,
              vehiculoId: viajeGuardado.vehiculoId,
              rutaId: viajeGuardado.rutaId,
              precio: viajeGuardado.precio,
              cupos: viajeGuardado.cupos,
              fechaSalida: viajeGuardado.fechaSalida,
              observaciones: viajeGuardado.observaciones,
              estado: viajeGuardado.estado,
              fechaCreacion: viajeGuardado.fechaCreacion,
            };
          } catch (error) {
            const mensaje =
              error instanceof Error && error.message
                ? error.message
                : 'No se pudo crear el viaje';

            this.logger.error(
              `Error creando viaje para conductor ${conductorId}: ${mensaje}`,
              error instanceof Error ? error.stack : undefined,
            );

            throw new BadRequestException('No se pudo crear el viaje');
          }
        }

      async obtenerTodosLosViajes(
        query: BuscarViajesQueryDto,
      ): Promise<ObtenerViajesResponse> {
        const limit = query.limit;
        const skip =
          query.skip > 0 ? query.skip : (query.page - 1) * query.limit;

        const qb = this.viajeRepository
          .createQueryBuilder('viaje')
          .leftJoin('viaje.ruta', 'ruta')
          .leftJoin('viaje.vehiculo', 'vehiculo')
          .select([
            'viaje.id',
            'viaje.conductorId',
            'viaje.vehiculoId',
            'viaje.rutaId',
            'viaje.precio',
            'viaje.cupos',
            'viaje.fechaSalida',
            'viaje.observaciones',
            'ruta.id',
            'ruta.nombre',
            'vehiculo.id',
            'vehiculo.marca',
            'vehiculo.referencia',
            'vehiculo.tipo',
          ])
          .where('viaje.estado = :estado', { estado: EstadoViaje.ACTIVO })
          .andWhere('viaje.fecha_eliminacion IS NULL')
          .andWhere('viaje.fecha_salida >= CURRENT_TIMESTAMP');

        if (query.q) {
          const q = `%${query.q}%`;

          qb.andWhere(
            new Brackets((subQb) => {
              subQb
                .where('CAST(viaje.id AS text) ILIKE :q', { q })
                .orWhere('CAST(viaje.conductor_id AS text) ILIKE :q', { q })
                .orWhere('CAST(viaje.vehiculo_id AS text) ILIKE :q', { q })
                .orWhere('CAST(viaje.ruta_id AS text) ILIKE :q', { q })
                .orWhere('CAST(viaje.precio AS text) ILIKE :q', { q })
                .orWhere('CAST(viaje.cupos AS text) ILIKE :q', { q })
                .orWhere('CAST(viaje.fecha_salida AS text) ILIKE :q', { q })
                .orWhere('COALESCE(viaje.observaciones, \'\') ILIKE :q', { q })
                .orWhere('ruta.nombre ILIKE :q', { q })
                .orWhere('vehiculo.marca ILIKE :q', { q })
                .orWhere('vehiculo.referencia ILIKE :q', { q })
                .orWhere('CAST(vehiculo.tipo AS text) ILIKE :q', { q });
            }),
          );
        }

        const [viajes, total] = await qb
          .orderBy('viaje.fecha_salida', 'ASC')
          .skip(skip)
          .take(limit)
          .getManyAndCount();

        return {
          viajes: viajes as ViajeListado[],
          meta: {
            page: query.skip > 0 ? Math.floor(skip / limit) + 1 : query.page,
            limit,
            skip,
            total,
            totalPages: Math.max(1, Math.ceil(total / limit)),
          },
        };
      }

      async obtenerViajePorConductorId(
        conductorId: string,
      ): Promise<ViajeConRutaYPuntos[]> {
        const viajes = await this.viajeRepository
          .createQueryBuilder('viaje')
          .leftJoinAndSelect('viaje.ruta', 'ruta')
          .leftJoinAndSelect('ruta.puntos', 'punto', 'punto.fecha_eliminacion IS NULL')
          .select([
            'viaje.id',
            'viaje.conductorId',
            'viaje.vehiculoId',
            'viaje.rutaId',
            'viaje.precio',
            'viaje.cupos',
            'viaje.fechaSalida',
            'viaje.observaciones',
            'viaje.estado',
            'viaje.fechaCreacion',
            'ruta.id',
            'ruta.nombre',
            'ruta.favorita',
            'punto.id',
            'punto.nombre',
            'punto.direccion',
            'punto.latitud',
            'punto.longitud',
            'punto.orden',
          ])
          .where('viaje.conductorId = :conductorId', { conductorId })
          .andWhere('viaje.fecha_eliminacion IS NULL')
          .orderBy('viaje.fechaSalida', 'ASC')
          .addOrderBy('punto.orden', 'ASC')
          .getMany();

        return viajes as ViajeConRutaYPuntos[];
      }
    
}
