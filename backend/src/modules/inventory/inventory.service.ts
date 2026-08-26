import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateMovementDto, CreateProductDto, CreateWarehouseDto } from './dto/inventory.dto';

export interface StockLine {
  productId: string;
  productName: string;
  category: string;
  unit: string;
  qty: number;
  minStock: number;
  belowMin: boolean;
}

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  private get tid() {
    return this.prisma.tenantId();
  }

  // ── Productos ──
  createProduct(dto: CreateProductDto) {
    return this.prisma.inputProduct.create({
      data: {
        tenantId: this.tid,
        name: dto.name,
        category: dto.category,
        unit: dto.unit ?? 'un',
        minStock: dto.minStock ?? 0,
        avgCost: dto.avgCost ?? 0,
      },
    });
  }

  listProducts() {
    return this.prisma.inputProduct.findMany({ where: { tenantId: this.tid }, orderBy: { name: 'asc' } });
  }

  // ── Depósitos ──
  async createWarehouse(dto: CreateWarehouseDto) {
    const est = await this.prisma.establishment.findFirst({ where: { id: dto.establishmentId, tenantId: this.tid } });
    if (!est) throw new NotFoundException('Establecimiento no encontrado');
    return this.prisma.inventoryWarehouse.create({
      data: { tenantId: this.tid, establishmentId: dto.establishmentId, name: dto.name },
    });
  }

  listWarehouses() {
    return this.prisma.inventoryWarehouse.findMany({ where: { tenantId: this.tid }, orderBy: { name: 'asc' } });
  }

  // ── Movimientos ──
  async createMovement(dto: CreateMovementDto) {
    await this.assertProduct(dto.productId);
    await this.assertWarehouse(dto.warehouseId);

    const movement = await this.recordMovement({
      warehouseId: dto.warehouseId,
      productId: dto.productId,
      type: dto.type,
      qty: dto.qty,
      unitCost: dto.unitCost,
      sourceType: 'manual',
      clientUuid: dto.clientUuid,
    });
    await this.checkStockAlert(dto.productId);
    return movement;
  }

  /**
   * Registra un movimiento (idempotente por clientUuid). Reusable por otros
   * módulos (ganadería/agricultura) para consumo automático de insumos.
   */
  async recordMovement(input: {
    warehouseId: string;
    productId: string;
    type: string;
    qty: number;
    unitCost?: number;
    sourceType?: string;
    sourceId?: string;
    clientUuid?: string;
  }) {
    if (input.clientUuid) {
      const existing = await this.prisma.inventoryMovement.findFirst({
        where: { tenantId: this.tid, clientUuid: input.clientUuid },
      });
      if (existing) return existing;
    }
    return this.prisma.inventoryMovement.create({
      data: {
        tenantId: this.tid,
        warehouseId: input.warehouseId,
        productId: input.productId,
        type: input.type,
        qty: input.qty,
        unitCost: input.unitCost ?? 0,
        sourceType: input.sourceType ?? 'manual',
        sourceId: input.sourceId,
        clientUuid: input.clientUuid,
      },
    });
  }

  /**
   * Consume un producto (movimiento 'out') eligiendo depósito automáticamente si
   * no se indica. Usado por eventos sanitarios, nutrición y órdenes de trabajo.
   * Devuelve el movimiento y si el stock quedó bajo el mínimo.
   */
  async consume(input: {
    productId: string;
    qty: number;
    sourceType: string;
    sourceId?: string;
    warehouseId?: string;
    clientUuid?: string;
  }): Promise<{ movementId: string; belowMin: boolean; stock: number }> {
    await this.assertProduct(input.productId);
    let warehouseId = input.warehouseId;
    if (warehouseId) {
      await this.assertWarehouse(warehouseId);
    } else {
      const wh = await this.prisma.inventoryWarehouse.findFirst({ where: { tenantId: this.tid } });
      if (!wh) throw new BadRequestException('No hay depósitos configurados');
      warehouseId = wh.id;
    }

    const movement = await this.recordMovement({
      warehouseId,
      productId: input.productId,
      type: 'out',
      qty: input.qty,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      clientUuid: input.clientUuid,
    });

    const { belowMin, qty } = await this.checkStockAlert(input.productId);
    return { movementId: movement.id, belowMin, stock: qty };
  }

  // ── Stock (calculado on-the-fly) ──
  async stockForProduct(productId: string): Promise<number> {
    const rows = await this.prisma.inventoryMovement.groupBy({
      by: ['type'],
      where: { tenantId: this.tid, productId },
      _sum: { qty: true },
    });
    let qty = 0;
    for (const r of rows) {
      const sum = r._sum.qty ?? 0;
      if (r.type === 'in' || r.type === 'adjust') qty += sum;
      else if (r.type === 'out') qty -= sum;
    }
    return qty;
  }

  async getStock(): Promise<StockLine[]> {
    const products = await this.prisma.inputProduct.findMany({ where: { tenantId: this.tid } });
    const lines: StockLine[] = [];
    for (const p of products) {
      const qty = await this.stockForProduct(p.id);
      lines.push({
        productId: p.id,
        productName: p.name,
        category: p.category,
        unit: p.unit,
        qty,
        minStock: p.minStock,
        belowMin: qty < p.minStock,
      });
    }
    return lines;
  }

  async getAlerts() {
    const stock = await this.getStock();
    return stock
      .filter((s) => s.belowMin)
      .map((s) => ({
        type: 'stock',
        severity: s.qty <= 0 ? 'high' : 'medium',
        productId: s.productId,
        message: `${s.productName}: stock ${s.qty} ${s.unit} por debajo del mínimo (${s.minStock})`,
      }));
  }

  private async checkStockAlert(productId: string): Promise<{ belowMin: boolean; qty: number }> {
    const product = await this.prisma.inputProduct.findFirst({ where: { id: productId, tenantId: this.tid } });
    const qty = await this.stockForProduct(productId);
    const belowMin = !!product && qty < product.minStock;
    if (belowMin && product) {
      await this.prisma.alert.create({
        data: {
          tenantId: this.tid,
          type: 'stock',
          severity: qty <= 0 ? 'high' : 'medium',
          message: `${product.name}: stock ${qty} ${product.unit} bajo el mínimo (${product.minStock})`,
          entityRef: `product:${productId}`,
        },
      });
    }
    return { belowMin, qty };
  }

  private async assertProduct(id: string) {
    const p = await this.prisma.inputProduct.findFirst({ where: { id, tenantId: this.tid } });
    if (!p) throw new NotFoundException('Producto no encontrado');
  }
  private async assertWarehouse(id: string) {
    const w = await this.prisma.inventoryWarehouse.findFirst({ where: { id, tenantId: this.tid } });
    if (!w) throw new NotFoundException('Depósito no encontrado');
  }
}
