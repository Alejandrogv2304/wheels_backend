import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { Repository } from 'typeorm';
import { PuntoRuta } from './entities/punto-ruta.entity';
import { CrearPuntoRutaDto } from '../rutas/dto/crear-punto-ruta.dto';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class PuntosRutaService {

  constructor(
      private readonly dataSource: DataSource,
  
       @InjectRepository(PuntoRuta)
      private readonly puntosRutaRepository: Repository<PuntoRuta>,
    ) {}
  crearPuntosParaRuta(
    manager: EntityManager,
    rutaId: string,
    puntos: CrearPuntoRutaDto[],
  ): Promise<PuntoRuta[]> {
    const puntoRepository = manager.getRepository(PuntoRuta);

    return this.crearPuntosSecuenciales(puntoRepository, rutaId, puntos);
  }

  private async crearPuntosSecuenciales(
    puntoRepository: Repository<PuntoRuta>,
    rutaId: string,
    puntos: CrearPuntoRutaDto[],
  ): Promise<PuntoRuta[]> {
    const puntosGuardados: PuntoRuta[] = [];

    for (const punto of puntos) {
      try {
        const entidad = puntoRepository.create({
          rutaId,
          nombre: punto.nombre.trim(),
          direccion: punto.direccion?.trim() ?? null,
          latitud: punto.latitud.toString(),
          longitud: punto.longitud.toString(),
          orden: punto.orden,
        });

        const puntoGuardado = await puntoRepository.save(entidad);
        puntosGuardados.push(puntoGuardado);
      } catch (error) {
        const mensaje =
          error instanceof Error && error.message
            ? error.message
            : 'No se pudo crear el punto de ruta';

        throw new BadRequestException(
          `No se pudo crear el punto de ruta "${punto.nombre}": ${mensaje}`,
        );
      }
    }

    return puntosGuardados;
  }

  async eliminarPuntoRuta(id: string, creadorId: string) {
  const punto = await this.puntosRutaRepository.findOne(
    { where: { id },
    relations: {
      ruta: true
    }
   }
  );

  if(!punto) {
    throw new NotFoundException('Punto de ruta no encontrado');
  }

  if(punto?.ruta.creadorId !== creadorId) {
    throw new ForbiddenException('No tienes permisos para eliminar este punto de ruta');
  }

  await this.puntosRutaRepository.softDelete(id);

  return { message: 'Punto de ruta eliminado correctamente' };
  }
}
