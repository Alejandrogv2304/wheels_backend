import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CatalogoVehiculo } from './entities/catalogo.entity';
import { Repository } from 'typeorm';
import { BuscarCatalogoVehiculoQueryDto } from './dto/buscar-catalogo-vehiculo.query.dto';

@Injectable()
export class CatalogoVehiculosService {

    constructor(
      
        @InjectRepository(CatalogoVehiculo)
        private readonly catalogoRepository: Repository<CatalogoVehiculo>,
    ){}

    async buscarCatalogoPorTipo(
      query: BuscarCatalogoVehiculoQueryDto,
    ): Promise<CatalogoVehiculo[]> {
      const qb = this.catalogoRepository.createQueryBuilder('catalogo');

      if (query.tipo) {
        qb.andWhere('catalogo.tipo = :tipo', { tipo: query.tipo });
      }

      if (query.q) {
        qb.andWhere(
          '(catalogo.marca ILIKE :q OR catalogo.modelo ILIKE :q)',
          { q: `%${query.q}%` },
        );
      }

      return qb
        .orderBy('catalogo.marca', 'ASC')
        .addOrderBy('catalogo.modelo', 'ASC')
        .getMany();
    }
}
