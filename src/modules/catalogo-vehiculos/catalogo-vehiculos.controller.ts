import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CatalogoVehiculosService } from './catalogo-vehiculos.service';
import { BuscarCatalogoVehiculoQueryDto } from './dto/buscar-catalogo-vehiculo.query.dto';

@ApiTags('Catalogo de Vehículos')
@Controller('catalogo')
export class CatalogoVehiculosController {
    constructor(private readonly catalogoVehiculosService: CatalogoVehiculosService) {}

  @ApiOperation({ summary: 'Obtener el catálogo de vehículos' })
  @Get()
  async obtenerCatalogo(
    @Query() query: BuscarCatalogoVehiculoQueryDto,
  ) {
     return this.catalogoVehiculosService.buscarCatalogoPorTipo(query);
  }
}
