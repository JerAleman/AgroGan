import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { CreateActivityDto, CreateCampaignDto, CreateCropDto } from './dto/agriculture.dto';

@Injectable()
export class AgricultureService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
  ) {}

  private get tid() {
    return this.prisma.tenantId();
  }

  createCrop(dto: CreateCropDto) {
    return this.prisma.crop.create({ data: { tenantId: this.tid, name: dto.name, species: dto.species } });
  }
  listCrops() {
    return this.prisma.crop.findMany({ where: { tenantId: this.tid }, orderBy: { name: 'asc' } });
  }

  async createCampaign(dto: CreateCampaignDto) {
    await this.assertEstablishment(dto.establishmentId);
    await this.assertCrop(dto.cropId);
    return this.prisma.cropCampaign.create({
      data: {
        tenantId: this.tid,
        establishmentId: dto.establishmentId,
        cropId: dto.cropId,
        season: dto.season,
        plannedAreaHa: dto.plannedAreaHa ?? 0,
        expectedYield: dto.expectedYield ?? 0,
        revenue: dto.revenue ?? 0,
        status: 'active',
      },
    });
  }
  listCampaigns() {
    return this.prisma.cropCampaign.findMany({
      where: { tenantId: this.tid },
      include: { crop: true, establishment: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createActivity(dto: CreateActivityDto) {
    const campaign = await this.prisma.cropCampaign.findFirst({ where: { id: dto.campaignId, tenantId: this.tid } });
    if (!campaign) throw new NotFoundException('Campaña no encontrada');
    const lot = await this.prisma.lot.findFirst({ where: { id: dto.lotId, tenantId: this.tid } });
    if (!lot) throw new NotFoundException('Lote no encontrado');

    if (dto.clientUuid) {
      const existing = await this.prisma.agriculturalActivity.findFirst({
        where: { tenantId: this.tid, clientUuid: dto.clientUuid },
      });
      if (existing) return existing;
    }

    const activity = await this.prisma.agriculturalActivity.create({
      data: {
        tenantId: this.tid,
        campaignId: dto.campaignId,
        lotId: dto.lotId,
        type: dto.type,
        areaHa: dto.areaHa ?? 0,
        costDirect: dto.costDirect ?? 0,
        yieldResult: dto.yieldResult ?? 0,
        date: dto.date ? new Date(dto.date) : new Date(),
        clientUuid: dto.clientUuid,
      },
    });

    if (dto.productId && dto.productQty) {
      await this.inventory.consume({
        productId: dto.productId,
        qty: dto.productQty,
        sourceType: 'work_order',
        sourceId: activity.id,
        clientUuid: dto.clientUuid ? `${dto.clientUuid}:inv` : undefined,
      });
    }
    return activity;
  }

  listActivities(campaignId?: string) {
    return this.prisma.agriculturalActivity.findMany({
      where: { tenantId: this.tid, ...(campaignId ? { campaignId } : {}) },
      orderBy: { date: 'desc' },
    });
  }

  /** Margen bruto por campaña = ingresos − suma de costos directos de labores. */
  async grossMargin(): Promise<
    {
      campaignId: string;
      crop: string;
      establishment: string;
      season: string;
      revenue: number;
      directCost: number;
      grossMargin: number;
      areaHa: number;
      grossMarginPerHa: number;
    }[]
  > {
    const campaigns = await this.prisma.cropCampaign.findMany({
      where: { tenantId: this.tid },
      include: { crop: true, establishment: true },
    });
    const result: {
      campaignId: string;
      crop: string;
      establishment: string;
      season: string;
      revenue: number;
      directCost: number;
      grossMargin: number;
      areaHa: number;
      grossMarginPerHa: number;
    }[] = [];
    for (const c of campaigns) {
      const agg = await this.prisma.agriculturalActivity.aggregate({
        where: { tenantId: this.tid, campaignId: c.id },
        _sum: { costDirect: true, areaHa: true },
      });
      const cost = agg._sum.costDirect ?? 0;
      const grossMargin = c.revenue - cost;
      const area = c.plannedAreaHa || (agg._sum.areaHa ?? 0);
      result.push({
        campaignId: c.id,
        crop: c.crop.name,
        establishment: c.establishment.name,
        season: c.season,
        revenue: c.revenue,
        directCost: cost,
        grossMargin,
        areaHa: area,
        grossMarginPerHa: area > 0 ? Number((grossMargin / area).toFixed(2)) : 0,
      });
    }
    return result;
  }

  private async assertEstablishment(id: string) {
    const e = await this.prisma.establishment.findFirst({ where: { id, tenantId: this.tid } });
    if (!e) throw new NotFoundException('Establecimiento no encontrado');
  }
  private async assertCrop(id: string) {
    const c = await this.prisma.crop.findFirst({ where: { id, tenantId: this.tid } });
    if (!c) throw new NotFoundException('Cultivo no encontrado');
  }
}
