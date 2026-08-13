import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CatalogoVehiculo } from './entities/catalogo.entity';
import { Repository } from 'typeorm';
import { BuscarCatalogoVehiculoQueryDto } from './dto/buscar-catalogo-vehiculo.query.dto';
import { CreateCatalogoVehiculoDto } from './dto/crear-registro-catalogo.dto';

@Injectable()
export class CatalogoVehiculosService {
    private readonly logger = new Logger(CatalogoVehiculosService.name);

    constructor(
      
        @InjectRepository(CatalogoVehiculo)
        private readonly catalogoRepository: Repository<CatalogoVehiculo>,
    ){}

    private normalizarTexto(valor: string): string {
      return valor.trim().replace(/\s+/g, ' ');
    }

    async buscarCatalogoPorTipo(
      query: BuscarCatalogoVehiculoQueryDto,
    ): Promise<CatalogoVehiculo[]> {
      const qb = this.catalogoRepository.createQueryBuilder('catalogo');

      if (query.tipo) {
        qb.andWhere('catalogo.tipo = :tipo', { tipo: query.tipo });
      }

      if (query.q) {
        qb.andWhere(
          '(catalogo.marca ILIKE :q OR catalogo.referencia ILIKE :q)',
          { q: `%${query.q}%` },
        );
      }

      return qb
        .orderBy('catalogo.marca', 'ASC')
        .addOrderBy('catalogo.referencia', 'ASC')
        .getMany();
    }

    async createRegistroCatalogo(dto: CreateCatalogoVehiculoDto) {
      const registroCatalogo = this.catalogoRepository.create({
        marca: this.normalizarTexto(dto.marca),
        referencia: this.normalizarTexto(dto.referencia),
        tipo: dto.tipo,
      });

      try {
        const registroCatalogoGuardado =
          await this.catalogoRepository.save(registroCatalogo);

        this.logger.log(
          `Registro de catálogo creado correctamente con id ${registroCatalogoGuardado.id}`,
        );

        return {
          id: registroCatalogoGuardado.id,
          marca: registroCatalogoGuardado.marca,
          referencia: registroCatalogoGuardado.referencia,
          tipo: registroCatalogoGuardado.tipo,
        };
      } catch (error) {
        const mensaje =
          error instanceof Error && error.message
            ? error.message
            : 'No se pudo crear el vehiculo en el catalogo';

        this.logger.error(
          `Error creando el vehiculo en el catalogo: ${mensaje}`,
          error instanceof Error ? error.stack : undefined,
        );

        const codigoError = (error as { code?: string } | undefined)?.code;
        if (codigoError === '23505') {
          throw new ConflictException('El vehiculo ya existe en el catálogo');
        }

        throw new BadRequestException(
          'No se pudo crear el vehiculo en el catalogo',
        );
      }
    }
}
