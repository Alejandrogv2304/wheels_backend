import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Repository } from 'typeorm';
import { PuntoRuta } from './entities/punto-ruta.entity';
import { CrearPuntoRutaDto } from '../rutas/dto/crear-punto-ruta.dto';

@Injectable()
export class PuntosRutaService {
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
}
