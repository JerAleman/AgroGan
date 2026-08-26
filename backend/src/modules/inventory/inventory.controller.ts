import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateMovementDto, CreateProductDto, CreateWarehouseDto } from './dto/inventory.dto';

@ApiTags('Inventory')
@ApiBearerAuth()
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get('products')
  products() {
    return this.inventory.listProducts();
  }
  @Post('products')
  createProduct(@Body() dto: CreateProductDto) {
    return this.inventory.createProduct(dto);
  }

  @Get('warehouses')
  warehouses() {
    return this.inventory.listWarehouses();
  }
  @Post('warehouses')
  createWarehouse(@Body() dto: CreateWarehouseDto) {
    return this.inventory.createWarehouse(dto);
  }

  @Post('movements')
  createMovement(@Body() dto: CreateMovementDto) {
    return this.inventory.createMovement(dto);
  }

  @Get('stock')
  stock() {
    return this.inventory.getStock();
  }

  @Get('alerts')
  alerts() {
    return this.inventory.getAlerts();
  }
}
