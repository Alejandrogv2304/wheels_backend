import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';
import { Ruta } from './entities/rutas.entity';
import { CrearRutaDto } from './dto/crear-ruta.dto';
import { PuntosRutaService } from '../puntos_ruta/puntos_ruta.service';
import { InjectRepository } from '@nestjs/typeorm';
import { ActualizarRutaDto } from './dto/actualizar-ruta.dto';
import { PuntoRuta } from '../puntos_ruta/entities/punto-ruta.entity';
import { ActualizarPuntoRutaDto } from './dto/actualizar-punto-ruta.dto';

@Injectable()
export class RutasService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly puntosRutaService: PuntosRutaService,

     @InjectRepository(Ruta)
    private readonly rutasRepository: Repository<Ruta>,
  ) {}

  private validarOrdenUnico(puntos: CrearRutaDto['puntos']): void {
    const ordenes = puntos.map((punto) => punto.orden);
    const ordenesUnicas = new Set(ordenes);

    if (ordenes.length !== ordenesUnicas.size) {
      throw new BadRequestException(
        'Cada punto de ruta debe tener un orden unico dentro de la ruta',
      );
    }
  }

  private validarPuntosActualizacion(
    puntos: ActualizarPuntoRutaDto[],
  ): void {
    if (puntos.length < 2) {
      throw new BadRequestException(
        'La ruta debe tener minimo dos puntos',
      );
    }

    const ids = puntos.filter((punto) => punto.id).map((punto) => punto.id!);
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException(
        'No se puede enviar el mismo punto mas de una vez',
      );
    }

    const ordenesOrdenadas = [...puntos]
      .map((punto) => punto.orden)
      .sort((a, b) => a - b);

    const ordenesEsperadas = Array.from(
      { length: puntos.length },
      (_, indice) => indice + 1,
    );

    const ordenesValidas = ordenesOrdenadas.every(
      (orden, indice) => orden === ordenesEsperadas[indice],
    );

    if (!ordenesValidas) {
      throw new BadRequestException(
        'Los puntos deben enviarse con orden consecutivo desde 1 y sin huecos',
      );
    }
  }

  private normalizarCoordenada(
    valor: number | null | undefined,
  ): string | null {
    if (valor === null || valor === undefined) {
      return null;
    }

    return valor.toString();
  }

  private calcularPuntosActivosFinales(
    puntosActualesActivos: PuntoRuta[],
    idsAEliminar: Set<string>,
    puntosNuevosParaGuardar: PuntoRuta[],
  ): number {
    const puntosQueSeConservan = puntosActualesActivos.filter(
      (punto) => !idsAEliminar.has(punto.id),
    );

    return puntosQueSeConservan.length + puntosNuevosParaGuardar.length;
  }

  async crearRuta(
    dto: CrearRutaDto,
    creadorId: string,
  ): Promise<Ruta & { puntos: Awaited<ReturnType<PuntosRutaService['crearPuntosParaRuta']>> }> {
    this.validarOrdenUnico(dto.puntos);

    return this.dataSource.transaction(async (manager) => {
      const rutaRepository = manager.getRepository(Ruta);

      const ruta = rutaRepository.create({
        creadorId,
        nombre: dto.nombre.trim(),
        favorita: dto.favorita ?? false,
      });

      const rutaGuardada = await rutaRepository.save(ruta);

      const puntos = await this.puntosRutaService.crearPuntosParaRuta(
        manager,
        rutaGuardada.id,
        dto.puntos,
      );

      const puntosOrdenados = [...puntos].sort((a, b) => a.orden - b.orden);

      return {
        ...rutaGuardada,
        puntos: puntosOrdenados,
      };
    });
  }



  async obtenerTodasLasRutas(creadorId: string): Promise<Ruta[]> {

    const rutas = await this.rutasRepository.find({
          select: {
        id: true,
        nombre: true,
        favorita: true,
        // puntos: {
        //   id: true,
        //   direccion: true, 
        //   orden: true,
        //   latitud: true,
        //   longitud: true,
        //   nombre: true,
        // },
      },
      // relations: {
      //   puntos: true, 
      // },
      // order: {
      //   puntos: {
      //     orden: 'ASC',
      //   },
      // },
      where: {
        creadorId,
      }
        });
    

    return rutas;
  }

  async obtenerRutaPorId(rutaId: string, creadorId: string): Promise<Ruta | null> {
    const ruta = await this.rutasRepository.findOne({
      where: {
        id: rutaId,
        creadorId,
      },
      relations: {
        puntos: true,
      },
      order: {
        puntos: {
          orden: 'ASC',
        },
      },
    });

    return ruta;
  }

  //La logica del metodo con los puntos es: Si el punto viene con id ya existia, solo valida si cambio algo
  //Si un punto viene sin id es un punto nuevo, entonces se crea, si un punto que existia no viene se elimina.
  async actualizarRuta(
    dto: ActualizarRutaDto,
    id: string,
    creadorId: string,
  ): Promise<Ruta & { puntos: PuntoRuta[] }> {
    this.validarPuntosActualizacion(dto.puntos);

    return this.dataSource.transaction(async (manager) => {
      const rutaRepository = manager.getRepository(Ruta);
      const puntoRepository = manager.getRepository(PuntoRuta);

      const ruta = await rutaRepository.findOne({
        where: {
          id,
        },
      });

      if (!ruta) {
        throw new NotFoundException('La ruta no existe');
      }

      if (ruta.creadorId !== creadorId) {
        throw new ForbiddenException(
          'No tienes permisos para actualizar esta ruta',
        );
      }

      const puntosActuales = await puntoRepository.find({
        where: {
          rutaId: ruta.id,
        },
        order: {
          orden: 'ASC',
        },
      });

      const puntosActualesPorId = new Map(
        puntosActuales.map((punto) => [punto.id, punto]),
      );

      const idsAEliminar = new Set(puntosActuales.map((punto) => punto.id));
      const puntosExistentesParaGuardar: PuntoRuta[] = [];
      const puntosNuevosParaGuardar: PuntoRuta[] = [];
      const puntosNuevosGuardados: PuntoRuta[] = [];

      for (const puntoDto of dto.puntos) {
        if (puntoDto.id) {
          const puntoExistente = puntosActualesPorId.get(puntoDto.id);

          if (!puntoExistente) {
            throw new BadRequestException(
              `El punto con id ${puntoDto.id} no pertenece a esta ruta o ya no existe`,
            );
          }

          idsAEliminar.delete(puntoDto.id);

          let cambioDetectado = false;
          const nombreNormalizado = puntoDto.nombre.trim();
          const direccionNormalizada =
            puntoDto.direccion === undefined
              ? puntoExistente.direccion
              : puntoDto.direccion;
          const latitudNormalizada =
            puntoDto.latitud === undefined
              ? null
              : this.normalizarCoordenada(puntoDto.latitud);
          const longitudNormalizada =
            puntoDto.longitud === undefined
              ? null
              : this.normalizarCoordenada(puntoDto.longitud);

          if (puntoExistente.nombre !== nombreNormalizado) {
            puntoExistente.nombre = nombreNormalizado;
            cambioDetectado = true;
          }

          if ((puntoExistente.direccion ?? null) !== (direccionNormalizada ?? null)) {
            puntoExistente.direccion = direccionNormalizada ?? null;
            cambioDetectado = true;
          }

          if (puntoExistente.latitud !== latitudNormalizada) {
            puntoExistente.latitud = latitudNormalizada;
            cambioDetectado = true;
          }

          if (puntoExistente.longitud !== longitudNormalizada) {
            puntoExistente.longitud = longitudNormalizada;
            cambioDetectado = true;
          }

          if (puntoExistente.orden !== puntoDto.orden) {
            puntoExistente.orden = puntoDto.orden;
            cambioDetectado = true;
          }

          if (cambioDetectado) {
            puntosExistentesParaGuardar.push(puntoExistente);
          }
        } else {
          const nuevoPunto = puntoRepository.create({
            rutaId: ruta.id,
            nombre: puntoDto.nombre.trim(),
            direccion: puntoDto.direccion ?? null,
            latitud: this.normalizarCoordenada(puntoDto.latitud),
            longitud: this.normalizarCoordenada(puntoDto.longitud),
            orden: puntoDto.orden,
          });

          puntosNuevosParaGuardar.push(nuevoPunto);
        }
      }

      const puntosActivosFinales = this.calcularPuntosActivosFinales(
        puntosActuales,
        idsAEliminar,
        puntosNuevosParaGuardar,
      );

      if (puntosActivosFinales < 2) {
        throw new BadRequestException(
          'La ruta debe quedar con al menos dos puntos activos',
        );
      }

      if (idsAEliminar.size > 0) {
        await puntoRepository.softDelete({
          id: In([...idsAEliminar]),
        });
      }

      if (puntosExistentesParaGuardar.length > 0) {
        await puntoRepository.save(puntosExistentesParaGuardar);
      }

      if (puntosNuevosParaGuardar.length > 0) {
        for (const puntoNuevo of puntosNuevosParaGuardar) {
          const puntoGuardado = await puntoRepository.save(puntoNuevo);
          puntosNuevosGuardados.push(puntoGuardado);
        }
      }

      if (dto.nombre !== undefined) {
        ruta.nombre = dto.nombre.trim();
      }

      if (dto.favorita !== undefined) {
        ruta.favorita = dto.favorita;
      }

      const rutaGuardada = await rutaRepository.save(ruta);
      const puntosOrdenados = await puntoRepository.find({
        where: {
          rutaId: rutaGuardada.id,
        },
        order: {
          orden: 'ASC',
        },
      });

      return {
        ...rutaGuardada,
        puntos: puntosOrdenados,
      };
    });
  }
}
