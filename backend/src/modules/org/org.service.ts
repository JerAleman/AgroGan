import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateEstablishmentDto, CreateFarmDto, CreateLotDto, CreatePaddockDto } from './dto/org.dto';

@Injectable()
export class OrgService {
  constructor(private readonly prisma: PrismaService) {}

  private get tid() {
    return this.prisma.tenantId();
  }

  // ── Companies ──
  listCompanies() {
    return this.prisma.company.findMany({ where: { tenantId: this.tid }, orderBy: { name: 'asc' } });
  }

  // ── Farms ──
  async createFarm(dto: CreateFarmDto) {
    await this.ensureCompany(dto.companyId);
    return this.prisma.farm.create({ data: { tenantId: this.tid, companyId: dto.companyId, name: dto.name } });
  }

  listFarms() {
    return this.prisma.farm.findMany({ where: { tenantId: this.tid }, orderBy: { name: 'asc' } });
  }

  // ── Establishments ──
  async createEstablishment(dto: CreateEstablishmentDto) {
    await this.ensureFarm(dto.farmId);
    return this.prisma.establishment.create({
      data: { tenantId: this.tid, farmId: dto.farmId, name: dto.name, totalAreaHa: dto.totalAreaHa ?? 0 },
    });
  }

  listEstablishments() {
    return this.prisma.establishment.findMany({ where: { tenantId: this.tid }, orderBy: { name: 'asc' } });
  }

  async getEstablishment(id: string) {
    const est = await this.prisma.establishment.findFirst({ where: { id, tenantId: this.tid } });
    if (!est) throw new NotFoundException('Establecimiento no encontrado');
    return est;
  }

  // ── Lots ──
  async createLot(dto: CreateLotDto) {
    await this.getEstablishment(dto.establishmentId);
    return this.prisma.lot.create({
      data: { tenantId: this.tid, establishmentId: dto.establishmentId, name: dto.name, areaHa: dto.areaHa ?? 0 },
    });
  }

  listLots(establishmentId?: string) {
    return this.prisma.lot.findMany({
      where: { tenantId: this.tid, ...(establishmentId ? { establishmentId } : {}) },
      orderBy: { name: 'asc' },
    });
  }

  // ── Paddocks ──
  async createPaddock(dto: CreatePaddockDto) {
    await this.getEstablishment(dto.establishmentId);
    return this.prisma.paddock.create({
      data: {
        tenantId: this.tid,
        establishmentId: dto.establishmentId,
        name: dto.name,
        areaHa: dto.areaHa ?? 0,
        forageType: dto.forageType,
      },
    });
  }

  listPaddocks(establishmentId?: string) {
    return this.prisma.paddock.findMany({
      where: { tenantId: this.tid, ...(establishmentId ? { establishmentId } : {}) },
      orderBy: { name: 'asc' },
    });
  }

  // ── helpers de integridad + aislamiento ──
  private async ensureCompany(id: string) {
    const c = await this.prisma.company.findFirst({ where: { id, tenantId: this.tid } });
    if (!c) throw new NotFoundException('Empresa no encontrada');
  }
  private async ensureFarm(id: string) {
    const f = await this.prisma.farm.findFirst({ where: { id, tenantId: this.tid } });
    if (!f) throw new NotFoundException('Campo no encontrado');
  }
}
