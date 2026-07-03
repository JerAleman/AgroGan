import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedTenant(opts: {
  name: string;
  email: string;
  withFullData: boolean;
}) {
  const passwordHash = await bcrypt.hash('Demo1234', 10);
  const tenant = await prisma.tenant.create({
    data: {
      name: opts.name,
      country: 'AR',
      defaultCurrency: 'ARS',
      companies: { create: { name: opts.name, country: 'AR' } },
      users: {
        create: { email: opts.email, passwordHash, fullName: 'Dueño Demo', role: 'owner' },
      },
    },
    include: { companies: true },
  });

  const company = tenant.companies[0];
  const farm = await prisma.farm.create({ data: { tenantId: tenant.id, companyId: company.id, name: `Campo ${opts.name}` } });
  const est = await prisma.establishment.create({
    data: { tenantId: tenant.id, farmId: farm.id, name: 'La Esperanza', totalAreaHa: opts.withFullData ? 2450 : 300 },
  });

  if (!opts.withFullData) return { tenant, est };

  // Depósito + productos
  const wh = await prisma.inventoryWarehouse.create({ data: { tenantId: tenant.id, establishmentId: est.id, name: 'Depósito Central' } });
  const aftosa = await prisma.inputProduct.create({
    data: { tenantId: tenant.id, name: 'Vacuna Aftosa', category: 'vacuna', unit: 'dosis', minStock: 300, avgCost: 120 },
  });
  const glifo = await prisma.inputProduct.create({
    data: { tenantId: tenant.id, name: 'Glifosato', category: 'fitosanitario', unit: 'L', minStock: 1000, avgCost: 8 },
  });
  await prisma.inputProduct.create({
    data: { tenantId: tenant.id, name: 'Urea', category: 'fertilizante', unit: 'kg', minStock: 500, avgCost: 0.9 },
  });
  // Ingresos de stock
  await prisma.inventoryMovement.create({ data: { tenantId: tenant.id, warehouseId: wh.id, productId: aftosa.id, type: 'in', qty: 250, unitCost: 120, sourceType: 'purchase' } });
  await prisma.inventoryMovement.create({ data: { tenantId: tenant.id, warehouseId: wh.id, productId: glifo.id, type: 'in', qty: 4800, unitCost: 8, sourceType: 'purchase' } });

  // Categorías + rodeo + batches
  const catVacas = await prisma.livestockCategory.create({ data: { tenantId: tenant.id, name: 'Vacas', species: 'bovino', sex: 'H' } });
  const catNovillos = await prisma.livestockCategory.create({ data: { tenantId: tenant.id, name: 'Novillos', species: 'bovino', sex: 'M' } });
  const catTerneros = await prisma.livestockCategory.create({ data: { tenantId: tenant.id, name: 'Terneros', species: 'bovino' } });
  const herd = await prisma.herd.create({ data: { tenantId: tenant.id, establishmentId: est.id, name: 'Rodeo General', purpose: 'cria' } });
  await prisma.livestockBatch.create({ data: { tenantId: tenant.id, herdId: herd.id, categoryId: catVacas.id, headCount: 1240, avgWeight: 420 } });
  await prisma.livestockBatch.create({ data: { tenantId: tenant.id, herdId: herd.id, categoryId: catNovillos.id, headCount: 812, avgWeight: 312 } });
  await prisma.livestockBatch.create({ data: { tenantId: tenant.id, herdId: herd.id, categoryId: catTerneros.id, headCount: 980, avgWeight: 95 } });

  // Movimientos ganaderos (período)
  await prisma.livestockMovement.create({ data: { tenantId: tenant.id, categoryId: catTerneros.id, type: 'birth', headCount: 210 } });
  await prisma.livestockMovement.create({ data: { tenantId: tenant.id, categoryId: catNovillos.id, type: 'sale', headCount: 40, amount: 8_400_000 } });

  // Evento sanitario con vencimiento próximo
  const batchVacas = await prisma.livestockBatch.findFirst({ where: { tenantId: tenant.id, categoryId: catVacas.id } });
  await prisma.healthEvent.create({
    data: {
      tenantId: tenant.id,
      batchId: batchVacas!.id,
      type: 'vacuna',
      productId: aftosa.id,
      dose: 1,
      headCount: 240,
      date: new Date(),
      nextDueDate: new Date(Date.now() + 4 * 86_400_000),
    },
  });
  // Consumo asociado (deja Aftosa por debajo del mínimo: 250 - 240 = 10 < 300)
  await prisma.inventoryMovement.create({ data: { tenantId: tenant.id, warehouseId: wh.id, productId: aftosa.id, type: 'out', qty: 240, sourceType: 'health_event' } });

  // Agricultura: cultivo + campaña + labores
  const soja = await prisma.crop.create({ data: { tenantId: tenant.id, name: 'Soja', species: 'Glycine max' } });
  const maiz = await prisma.crop.create({ data: { tenantId: tenant.id, name: 'Maíz', species: 'Zea mays' } });
  const lote7 = await prisma.lot.create({ data: { tenantId: tenant.id, establishmentId: est.id, name: 'Lote 7', areaHa: 120 } });
  const lote12 = await prisma.lot.create({ data: { tenantId: tenant.id, establishmentId: est.id, name: 'Lote 12', areaHa: 90 } });

  const campSoja = await prisma.cropCampaign.create({
    data: { tenantId: tenant.id, establishmentId: est.id, cropId: soja.id, season: '24/25', plannedAreaHa: 120, revenue: 96_000, status: 'active' },
  });
  await prisma.agriculturalActivity.create({ data: { tenantId: tenant.id, campaignId: campSoja.id, lotId: lote7.id, type: 'siembra', areaHa: 120, costDirect: 30_000 } });
  await prisma.agriculturalActivity.create({ data: { tenantId: tenant.id, campaignId: campSoja.id, lotId: lote7.id, type: 'cosecha', areaHa: 120, costDirect: 27_600, yieldResult: 3.4 } });

  const campMaiz = await prisma.cropCampaign.create({
    data: { tenantId: tenant.id, establishmentId: est.id, cropId: maiz.id, season: '24/25', plannedAreaHa: 90, revenue: 54_000, status: 'active' },
  });
  await prisma.agriculturalActivity.create({ data: { tenantId: tenant.id, campaignId: campMaiz.id, lotId: lote12.id, type: 'siembra', areaHa: 90, costDirect: 33_150 } });
  await prisma.agriculturalActivity.create({ data: { tenantId: tenant.id, campaignId: campMaiz.id, lotId: lote12.id, type: 'cosecha', areaHa: 90, costDirect: 24_000, yieldResult: 7.2 } });

  return { tenant, est };
}

async function main() {
  console.log('🌱 Seeding Agro360 Cloud...');
  await prisma.aiMessage.deleteMany();
  await prisma.aiConversation.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.agriculturalActivity.deleteMany();
  await prisma.cropCampaign.deleteMany();
  await prisma.crop.deleteMany();
  await prisma.healthEvent.deleteMany();
  await prisma.weighingEvent.deleteMany();
  await prisma.livestockMovement.deleteMany();
  await prisma.livestockBatch.deleteMany();
  await prisma.herd.deleteMany();
  await prisma.livestockCategory.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.inventoryWarehouse.deleteMany();
  await prisma.inputProduct.deleteMany();
  await prisma.lot.deleteMany();
  await prisma.paddock.deleteMany();
  await prisma.establishment.deleteMany();
  await prisma.farm.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  await seedTenant({ name: 'La Esperanza SA', email: 'demo@agro360.cloud', withFullData: true });
  await seedTenant({ name: 'Don Pedro SRL', email: 'otro@agro360.cloud', withFullData: false });

  console.log('✅ Seed completo.');
  console.log('   Login demo:  demo@agro360.cloud / Demo1234  (tenant con datos)');
  console.log('   Login demo2: otro@agro360.cloud / Demo1234  (tenant vacío, para probar aislamiento)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
