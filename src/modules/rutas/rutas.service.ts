import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Ruta } from './entities/rutas.entity';
import { CrearRutaDto } from './dto/crear-ruta.dto';
import { PuntosRutaService } from '../puntos_ruta/puntos_ruta.service';
import { InjectRepository } from '@nestjs/typeorm';
import { ActualizarRutaDto } from './dto/actualizar-ruta.dto';

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

  async actualizarRuta(
    dto: ActualizarRutaDto,
    id: string,
    creadorId: string,
  ): Promise<Ruta> {
    if (dto.nombre === undefined && dto.favorita === undefined) {
      throw new BadRequestException(
        'Debes enviar al menos un campo para actualizar',
      );
    }

    const ruta = await this.rutasRepository.findOneBy({ id, creadorId });

    if (!ruta) {
      throw new NotFoundException('La ruta no existe');
    }

    if (dto.nombre !== undefined) {
      ruta.nombre = dto.nombre.trim();
    }

    if (dto.favorita !== undefined) {
      ruta.favorita = dto.favorita;
    }

    return this.rutasRepository.save(ruta);
  }
}
