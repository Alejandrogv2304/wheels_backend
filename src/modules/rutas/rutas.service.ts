import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Ruta } from './entities/rutas.entity';
import { CrearRutaDto } from './dto/crear-ruta.dto';
import { PuntosRutaService } from '../puntos_ruta/puntos_ruta.service';

@Injectable()
export class RutasService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly puntosRutaService: PuntosRutaService,
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
}
