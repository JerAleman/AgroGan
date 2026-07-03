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
        create: { email: opts.email, passwordHash, fullName: 'Dueno Demo', role: 'owner' },
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

  // Deposito + productos
  const wh = await prisma.inventoryWarehouse.create({ data: { tenantId: tenant.id, establishmentId: est.id, name: 'Deposito Central' } });
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

  // Categorias + rodeo + batches
  const catVacas = await prisma.livestockCategory.create({ data: { tenantId: tenant.id, name: 'Vacas', species: 'bovino', sex: 'H' } });
  const catNovillos = await prisma.livestockCategory.create({ data: { tenantId: tenant.id, name: 'Novillos', species: 'bovino', sex: 'M' } });
  const catTerneros = await prisma.livestockCategory.create({ data: { tenantId: tenant.id, name: 'Terneros', species: 'bovino' } });
  const herd = await prisma.herd.create({ data: { tenantId: tenant.id, establishmentId: est.id, name: 'Rodeo General', purpose: 'cria' } });
  const batchVacas = await prisma.livestockBatch.create({ data: { tenantId: tenant.id, herdId: herd.id, categoryId: catVacas.id, headCount: 1240, avgWeight: 420 } });
  await prisma.livestockBatch.create({ data: { tenantId: tenant.id, herdId: herd.id, categoryId: catNovillos.id, headCount: 812, avgWeight: 312 } });
  await prisma.livestockBatch.create({ data: { tenantId: tenant.id, herdId: herd.id, categoryId: catTerneros.id, headCount: 980, avgWeight: 95 } });

  // Movimientos ganaderos (periodo)
  await prisma.livestockMovement.create({ data: { tenantId: tenant.id, categoryId: catTerneros.id, type: 'birth', headCount: 210 } });
  await prisma.livestockMovement.create({ data: { tenantId: tenant.id, categoryId: catNovillos.id, type: 'sale', headCount: 40, amount: 8_400_000 } });

  // Evento sanitario con vencimiento proximo
  await prisma.healthEvent.create({
    data: {
      tenantId: tenant.id,
      batchId: batchVacas.id,
      type: 'vacuna',
      productId: aftosa.id,
      dose: 1,
      headCount: 240,
      date: new Date(),
      nextDueDate: new Date(Date.now() + 4 * 86_400_000),
    },
  });
  await prisma.inventoryMovement.create({ data: { tenantId: tenant.id, warehouseId: wh.id, productId: aftosa.id, type: 'out', qty: 240, sourceType: 'health_event' } });

  // Agricultura: cultivo + campania + labores
  const soja = await prisma.crop.create({ data: { tenantId: tenant.id, name: 'Soja', species: 'Glycine max' } });
  const maiz = await prisma.crop.create({ data: { tenantId: tenant.id, name: 'Maiz', species: 'Zea mays' } });
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

  // ── Reproduccion / Cria ──
  const toro = await prisma.sire.create({ data: { tenantId: tenant.id, name: 'El Patron', breed: 'Angus', sireType: 'toro' } });
  await prisma.reproductiveEvent.create({ data: { tenantId: tenant.id, batchId: batchVacas.id, sireId: toro.id, type: 'servicio', headCount: 800 } });
  await prisma.reproductiveEvent.create({ data: { tenantId: tenant.id, batchId: batchVacas.id, sireId: toro.id, type: 'tacto', headCount: 680, result: 'prenada' } });
  await prisma.reproductiveEvent.create({ data: { tenantId: tenant.id, batchId: batchVacas.id, sireId: toro.id, type: 'tacto', headCount: 120, result: 'vacia' } });
  await prisma.reproductiveEvent.create({ data: { tenantId: tenant.id, batchId: batchVacas.id, type: 'paricion', headCount: 650 } });
  await prisma.reproductiveEvent.create({ data: { tenantId: tenant.id, batchId: batchVacas.id, type: 'destete', headCount: 620 } });

  // ── Feedlot ──
  const pen1 = await prisma.feedlotPen.create({ data: { tenantId: tenant.id, name: 'Corral 1', capacity: 150 } });
  const pen2 = await prisma.feedlotPen.create({ data: { tenantId: tenant.id, name: 'Corral 2', capacity: 200 } });
  const diet = await prisma.feedlotDiet.create({ data: { tenantId: tenant.id, name: 'Terminacion', costPerKg: 0.45, composition: '{"maiz":60,"silo":25,"nucleo":15}' } });
  const troop1 = await prisma.feedlotTroop.create({ data: { tenantId: tenant.id, penId: pen1.id, categoryName: 'Novillos 350+', headCount: 120, entryWeight: 350, currentWeight: 395, targetWeight: 450 } });
  await prisma.feedlotConsumption.create({ data: { tenantId: tenant.id, troopId: troop1.id, dietId: diet.id, kgConsumed: 1200 } });
  await prisma.feedlotConsumption.create({ data: { tenantId: tenant.id, troopId: troop1.id, dietId: diet.id, kgConsumed: 1180 } });

  // ── Tambo ──
  const cow1 = await prisma.dairyCow.create({ data: { tenantId: tenant.id, identifier: 'RP-001', status: 'active', lactationNumber: 3 } });
  const cow2 = await prisma.dairyCow.create({ data: { tenantId: tenant.id, identifier: 'RP-002', status: 'active', lactationNumber: 2 } });
  const cow3 = await prisma.dairyCow.create({ data: { tenantId: tenant.id, identifier: 'RP-003', status: 'dry', lactationNumber: 4 } });
  for (let d = 0; d < 10; d++) {
    const date = new Date(Date.now() - d * 86_400_000);
    await prisma.dailyMilkProduction.create({ data: { tenantId: tenant.id, cowId: cow1.id, date, liters: 28 + Math.random() * 4, fatPct: 3.8, proteinPct: 3.2, somaticCells: 150000 } });
    await prisma.dailyMilkProduction.create({ data: { tenantId: tenant.id, cowId: cow2.id, date, liters: 24 + Math.random() * 3, fatPct: 3.9, proteinPct: 3.3, somaticCells: 180000 } });
  }
  await prisma.milkSettlement.create({ data: { tenantId: tenant.id, periodFrom: new Date('2025-06-01'), periodTo: new Date('2025-06-15'), totalLiters: 8400, pricePerLiter: 350, bonuses: 50000, deductions: 12000, totalAmount: 8400 * 350 + 50000 - 12000 } });

  // ── Finanzas ──
  const caja = await prisma.financeAccount.create({ data: { tenantId: tenant.id, name: 'Caja Principal', type: 'caja', balance: 5_000_000 } });
  await prisma.financeAccount.create({ data: { tenantId: tenant.id, name: 'Banco Nacion', type: 'banco', balance: 12_000_000 } });
  await prisma.financeTransaction.create({ data: { tenantId: tenant.id, accountId: caja.id, type: 'ingreso', category: 'venta_hacienda', amount: 8_400_000, description: 'Venta 40 novillos', counterparty: 'Frigorifico ABC' } });
  await prisma.financeTransaction.create({ data: { tenantId: tenant.id, accountId: caja.id, type: 'egreso', category: 'compra_insumos', amount: 1_200_000, description: 'Compra vacunas y productos veterinarios', counterparty: 'Veterinaria Rural' } });
  await prisma.financeTransaction.create({ data: { tenantId: tenant.id, accountId: caja.id, type: 'egreso', category: 'combustible', amount: 450_000, description: 'Gasoil mensual' } });
  await prisma.financeTransaction.create({ data: { tenantId: tenant.id, accountId: caja.id, type: 'egreso', category: 'salarios', amount: 2_800_000, description: 'Salarios personal' } });

  // ── Servicios a Terceros ──
  const customer = await prisma.serviceCustomer.create({ data: { tenantId: tenant.id, name: 'Estancia El Roble', taxId: '30-12345678-9', contact: '11-5555-1234' } });
  await prisma.serviceOrder.create({ data: { tenantId: tenant.id, customerId: customer.id, type: 'cosecha', description: 'Cosecha soja 200 ha', areaHa: 200, amount: 1_600_000, cost: 800_000, status: 'completed' } });
  await prisma.serviceOrder.create({ data: { tenantId: tenant.id, customerId: customer.id, type: 'fumigacion', description: 'Fumigacion pre-siembra', areaHa: 300, amount: 900_000, cost: 350_000, status: 'invoiced' } });

  // ── IoT ──
  const weatherStation = await prisma.iotDevice.create({ data: { tenantId: tenant.id, name: 'Estacion Meteo Lote 7', deviceType: 'weather_station', location: 'Lote 7 - centro' } });
  await prisma.iotDevice.create({ data: { tenantId: tenant.id, name: 'Balanza Corral 1', deviceType: 'scale', location: 'Feedlot - Corral 1' } });
  for (let h = 0; h < 12; h++) {
    const ts = new Date(Date.now() - h * 3_600_000);
    await prisma.iotMeasurement.create({ data: { tenantId: tenant.id, deviceId: weatherStation.id, metric: 'temperature', value: 18 + Math.random() * 8, unit: 'C', timestamp: ts } });
    await prisma.iotMeasurement.create({ data: { tenantId: tenant.id, deviceId: weatherStation.id, metric: 'humidity', value: 50 + Math.random() * 30, unit: '%', timestamp: ts } });
  }
  await prisma.iotAlertRule.create({ data: { tenantId: tenant.id, deviceId: weatherStation.id, metric: 'temperature', operator: 'gt', threshold: 38, severity: 'high', message: 'Temperatura extrema detectada' } });

  return { tenant, est };
}

async function main() {
  console.log('Seeding Agro360 Cloud...');
  // Clean in reverse dependency order
  await prisma.iotMeasurement.deleteMany();
  await prisma.iotAlertRule.deleteMany();
  await prisma.iotDevice.deleteMany();
  await prisma.serviceOrder.deleteMany();
  await prisma.serviceCustomer.deleteMany();
  await prisma.financeTransaction.deleteMany();
  await prisma.financeAccount.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.milkSettlement.deleteMany();
  await prisma.dailyMilkProduction.deleteMany();
  await prisma.dairyCow.deleteMany();
  await prisma.feedlotConsumption.deleteMany();
  await prisma.feedlotTroop.deleteMany();
  await prisma.feedlotDiet.deleteMany();
  await prisma.feedlotPen.deleteMany();
  await prisma.reproductiveEvent.deleteMany();
  await prisma.sire.deleteMany();
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
  await prisma.machineTask.deleteMany();
  await prisma.maintenanceOrder.deleteMany();
  await prisma.machine.deleteMany();

  await seedTenant({ name: 'La Esperanza SA', email: 'demo@agro360.cloud', withFullData: true });
  await seedTenant({ name: 'Don Pedro SRL', email: 'otro@agro360.cloud', withFullData: false });

  console.log('Seed completo.');
  console.log('   Login demo:  demo@agro360.cloud / Demo1234  (tenant con datos)');
  console.log('   Login demo2: otro@agro360.cloud / Demo1234  (tenant vacio, para probar aislamiento)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
