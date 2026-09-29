import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Not, QueryFailedError, Repository } from 'typeorm';
import { EstadoReserva, Reserva } from './entities/reserva.entity';
import { Viaje, EstadoViaje } from '../viajes/entities/viajes.entity';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { cancelacionResponse } from './types/cancelacion-response';
import type {
  ObtenerReservasResponse,
  ReservaResponse,
} from './types/reserva-response';
import { InjectRepository } from '@nestjs/typeorm';
import { BuscarReservasQueryDto } from './dto/buscar-reservas.query.dto';

type PostgresError = QueryFailedError & {
  code?: string;
};

@Injectable()
export class ReservasService {
  private readonly logger = new Logger(ReservasService.name);

  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(Reserva)
    private readonly reservaRepository: Repository<Reserva>,
  ) {}

  async hacerReserva(
    dto: CreateReservaDto,
    pasajeroId: string,
  ): Promise<Reserva> {
    return this.dataSource
      .transaction(async (manager) => {
        const viajeRepository = manager.getRepository(Viaje);
        const reservaRepository = manager.getRepository(Reserva);

        const viaje = await viajeRepository.findOne({
          where: { id: dto.viajeId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!viaje) {
          throw new NotFoundException('No existe un viaje con el ID indicado');
        }

        if (viaje.conductorId === pasajeroId) {
          throw new ForbiddenException(
            'No puedes reservar tu propio viaje como pasajero',
          );
        }

        if (viaje.estado !== EstadoViaje.ACTIVO) {
          throw new BadRequestException(
            'Solo puedes reservar viajes que estén en estado activo',
          );
        }

        if (viaje.cupos <= 0) {
          throw new BadRequestException(
            'No hay cupos disponibles para este viaje',
          );
        }

        const reservaExistente = await reservaRepository.findOne({
          where: {
            pasajeroId,
            viajeId: dto.viajeId,
            estado: Not(EstadoReserva.CANCELADA),
          },
        });

        if (reservaExistente) {
          throw new ConflictException(
            'Ya existe una reserva de este pasajero para este viaje',
          );
        }

        const reserva = reservaRepository.create({
          pasajeroId,
          viajeId: dto.viajeId,
        });

        const reservaGuardada = await reservaRepository.save(reserva);

        const resultadoDescuento = await viajeRepository
          .createQueryBuilder()
          .update(Viaje)
          .set({
            cupos: () => '"cupos" - 1',
          })
          .where('id = :id', { id: viaje.id })
          .andWhere('cupos > 0')
          .andWhere('estado = :estado', { estado: EstadoViaje.ACTIVO })
          .execute();

        if (resultadoDescuento.affected !== 1) {
          throw new BadRequestException(
            'No fue posible descontar el cupo del viaje porque ya no hay disponibilidad',
          );
        }

        this.logger.log(
          `Reserva creada correctamente para pasajero ${pasajeroId} en el viaje ${dto.viajeId}`,
        );

        return reservaGuardada;
      })
      .catch((error: unknown) => {
        if (this.esErrorPostgres(error) && error.code === '23505') {
          throw new ConflictException(
            'Ya existe una reserva de este pasajero para este viaje',
          );
        }

        throw error;
      });
  }

  async cancelarReserva(
    reservaId: string,
    pasajeroId: string,
  ): Promise<cancelacionResponse> {
    return this.dataSource.transaction(async (manager) => {
      const viajeRepository = manager.getRepository(Viaje);
      const reservaRepository = manager.getRepository(Reserva);

      const reserva = await reservaRepository.findOne({
        where: { id: reservaId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!reserva) {
        throw new NotFoundException('No existe una reserva con el ID indicado');
      }

      if (reserva.pasajeroId !== pasajeroId) {
        throw new ForbiddenException(
          'No tienes permiso para cancelar esta reserva',
        );
      }

      if (reserva.estado === EstadoReserva.CANCELADA) {
        throw new ConflictException('La reserva ya se encuentra cancelada');
      }

      if (reserva.estado === EstadoReserva.FINALIZADA) {
        throw new BadRequestException(
          'No puedes cancelar una reserva que ya fue finalizada',
        );
      }

      const viaje = await viajeRepository.findOne({
        where: { id: reserva.viajeId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!viaje) {
        throw new NotFoundException(
          'El viaje asociado a la reserva ya no existe',
        );
      }

      if (viaje.estado !== EstadoViaje.ACTIVO) {
        throw new BadRequestException(
          'Solo puedes cancelar reservas de viajes activos',
        );
      }

      reserva.estado = EstadoReserva.CANCELADA;
      await reservaRepository.save(reserva);

      const reservaCancelada = await reservaRepository.findOne({
        where: { id: reserva.id },
      });

      if (!reservaCancelada) {
        throw new NotFoundException(
          'No fue posible leer la reserva cancelada desde la base de datos',
        );
      }

      const resultadoAumento = await viajeRepository
        .createQueryBuilder()
        .update(Viaje)
        .set({
          cupos: () => '"cupos" + 1',
        })
        .where('id = :id', { id: viaje.id })
        .andWhere('estado = :estado', { estado: EstadoViaje.ACTIVO })
        .execute();

      if (resultadoAumento.affected !== 1) {
        throw new BadRequestException(
          'No fue posible devolver el cupo al viaje',
        );
      }

      this.logger.log(
        `Reserva cancelada correctamente para pasajero ${pasajeroId} en la reserva ${reservaId}`,
      );

      return {
        id: reservaCancelada.id,
        viajeId: reservaCancelada.viajeId,
        estado: reservaCancelada.estado,
        fechaActualizacion: reservaCancelada.fechaActualizacion!,
      };
    });
  }

  private esErrorPostgres(error: unknown): error is PostgresError {
    return (
      error instanceof QueryFailedError ||
      (typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        typeof (error as { code?: string }).code === 'string')
    );
  }

  async obtenerReservasPorPasajeroId(
    pasajeroId: string,
    query: BuscarReservasQueryDto,
  ): Promise<ObtenerReservasResponse> {
    const limit = query.limit;
    const skip = query.skip > 0 ? query.skip : (query.page - 1) * limit;

    const [reservas, total] = await this.reservaRepository
      .createQueryBuilder('reserva')
      .leftJoinAndSelect('reserva.viaje', 'viaje')
      .leftJoinAndSelect('viaje.ruta', 'ruta')
      .leftJoinAndSelect('viaje.conductor', 'conductor')
      .select([
        'reserva.id',
        'reserva.viajeId',
        'reserva.estado',
        'reserva.fechaCreacion',
        'viaje.id',
        'viaje.precio',
        'viaje.fechaSalida',
        'ruta.id',
        'ruta.nombre',
        'conductor.id',
        'conductor.nombre',
        'conductor.telefono',
      ])
      .where('reserva.pasajeroId = :pasajeroId', { pasajeroId })
      .andWhere('viaje.fecha_eliminacion IS NULL')
      .andWhere('viaje.fecha_salida >= CURRENT_TIMESTAMP')
      .orderBy('reserva.fechaCreacion', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const reservasResponse: ReservaResponse[] = reservas.map((reserva) => ({
      id: reserva.id,
      viajeId: reserva.viajeId,
      estado: reserva.estado,
      fechaCreacion: reserva.fechaCreacion,
      viaje: {
        id: reserva.viaje.id,
        precio: reserva.viaje.precio,
        fechaSalida: reserva.viaje.fechaSalida,
        conductor: {
          id: reserva.viaje.conductor.id,
          nombre: reserva.viaje.conductor.nombre,
          telefono: reserva.viaje.conductor.telefono,
        },
        ruta: {
          id: reserva.viaje.ruta.id,
          nombre: reserva.viaje.ruta.nombre,
        },
      },
    }));

    return {
      reservas: reservasResponse,
      meta: {
        page: query.skip > 0 ? Math.floor(skip / limit) + 1 : query.page,
        limit,
        skip,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }
}
