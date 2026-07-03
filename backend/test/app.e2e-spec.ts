import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * E2E del MVP: cubre el flujo de negocio principal y —de forma crítica— el
 * aislamiento entre tenants. Usa la base SQLite ya migrada (prisma db push).
 */
describe('Agro360 API (e2e)', () => {
  let app: INestApplication;
  const uniq = Date.now();
  const emailA = `tenantA_${uniq}@test.com`;
  const emailB = `tenantB_${uniq}@test.com`;
  let tokenA = '';
  let tokenB = '';
  let establishmentAId = '';

  const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('health check es público', async () => {
    const res = await request(app.getHttpServer()).get('/v1/health').expect(200);
    expect(res.body.status).toBe('ok');
  });

  it('rechaza acceso sin token (401)', async () => {
    await request(app.getHttpServer()).get('/v1/livestock/stock').expect(401);
  });

  it('registra dos tenants (A y B)', async () => {
    const a = await request(app.getHttpServer())
      .post('/v1/auth/register-tenant')
      .send({ companyName: 'Tenant A', adminEmail: emailA, adminFullName: 'Dueño A', password: 'secret123' })
      .expect(201);
    tokenA = a.body.accessToken;
    expect(tokenA).toBeTruthy();

    const b = await request(app.getHttpServer())
      .post('/v1/auth/register-tenant')
      .send({ companyName: 'Tenant B', adminEmail: emailB, adminFullName: 'Dueño B', password: 'secret123' })
      .expect(201);
    tokenB = b.body.accessToken;
    expect(tokenB).toBeTruthy();
  });

  it('login funciona y /me devuelve el tenant correcto', async () => {
    const login = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: emailA, password: 'secret123' })
      .expect(201);
    const me = await request(app.getHttpServer()).get('/v1/auth/me').set(auth(login.body.accessToken)).expect(200);
    expect(me.body.email).toBe(emailA);
    expect(me.body.tenant.name).toBe('Tenant A');
  });

  it('crea la estructura de campo y una tropa (tenant A)', async () => {
    const companies = await request(app.getHttpServer()).get('/v1/companies').set(auth(tokenA)).expect(200);
    const farm = await request(app.getHttpServer())
      .post('/v1/farms')
      .set(auth(tokenA))
      .send({ companyId: companies.body[0].id, name: 'Campo Norte' })
      .expect(201);
    const est = await request(app.getHttpServer())
      .post('/v1/establishments')
      .set(auth(tokenA))
      .send({ farmId: farm.body.id, name: 'La Loma', totalAreaHa: 1000 })
      .expect(201);
    establishmentAId = est.body.id;
    expect(establishmentAId).toBeTruthy();
  });

  it('flujo ganadero: pesadas calculan ADG y sanidad descuenta inventario con alerta', async () => {
    // Inventario: depósito + vacuna (minStock 300) + ingreso 250
    const wh = await request(app.getHttpServer())
      .post('/v1/inventory/warehouses')
      .set(auth(tokenA))
      .send({ establishmentId: establishmentAId, name: 'Depósito' })
      .expect(201);
    const product = await request(app.getHttpServer())
      .post('/v1/inventory/products')
      .set(auth(tokenA))
      .send({ name: 'Aftosa', category: 'vacuna', unit: 'dosis', minStock: 300 })
      .expect(201);
    await request(app.getHttpServer())
      .post('/v1/inventory/movements')
      .set(auth(tokenA))
      .send({ warehouseId: wh.body.id, productId: product.body.id, type: 'in', qty: 250 })
      .expect(201);

    // Ganadería: categoría + rodeo + tropa
    const cat = await request(app.getHttpServer())
      .post('/v1/livestock/categories')
      .set(auth(tokenA))
      .send({ name: 'Novillos' })
      .expect(201);
    const herd = await request(app.getHttpServer())
      .post('/v1/livestock/herds')
      .set(auth(tokenA))
      .send({ establishmentId: establishmentAId, name: 'Rodeo 1' })
      .expect(201);
    const batch = await request(app.getHttpServer())
      .post('/v1/livestock/batches')
      .set(auth(tokenA))
      .send({ herdId: herd.body.id, categoryId: cat.body.id, headCount: 240, avgWeight: 300 })
      .expect(201);

    // Pesada 1 y 2 → ADG = (315-300)/30 = 0.5
    const now = Date.now();
    await request(app.getHttpServer())
      .post('/v1/livestock/weighings')
      .set(auth(tokenA))
      .send({ batchId: batch.body.id, weight: 300, date: new Date(now - 30 * 86400000).toISOString() })
      .expect(201);
    const w2 = await request(app.getHttpServer())
      .post('/v1/livestock/weighings')
      .set(auth(tokenA))
      .send({ batchId: batch.body.id, weight: 315, date: new Date(now).toISOString() })
      .expect(201);
    expect(w2.body.adg).toBeCloseTo(0.5, 2);

    // Evento sanitario: consume 240 dosis (250-240=10 < 300 → alerta)
    const health = await request(app.getHttpServer())
      .post('/v1/livestock/health-events')
      .set(auth(tokenA))
      .send({ batchId: batch.body.id, type: 'vacuna', productId: product.body.id, dose: 1, headCount: 240 })
      .expect(201);
    expect(health.body.inventory.belowMin).toBe(true);
    expect(health.body.inventory.stock).toBe(10);

    // Alertas de inventario reflejan el faltante
    const alerts = await request(app.getHttpServer()).get('/v1/inventory/alerts').set(auth(tokenA)).expect(200);
    expect(alerts.body.length).toBeGreaterThanOrEqual(1);
  });

  it('copiloto responde sobre datos propios con explicabilidad', async () => {
    const stock = await request(app.getHttpServer())
      .post('/v1/ai/ask')
      .set(auth(tokenA))
      .send({ text: '¿cuánto stock de novillos tengo?' })
      .expect(201);
    expect(stock.body.answer).toContain('240');
    expect(stock.body.explainability.confidence).toBeGreaterThan(0);

    const insumos = await request(app.getHttpServer())
      .post('/v1/ai/ask')
      .set(auth(tokenA))
      .send({ text: '¿qué insumos debo comprar?' })
      .expect(201);
    expect(insumos.body.answer.toLowerCase()).toContain('aftosa');
  });

  it('sync offline es idempotente (no duplica por clientUuid)', async () => {
    const cat = await request(app.getHttpServer()).get('/v1/livestock/categories').set(auth(tokenA));
    const herd = await request(app.getHttpServer()).get('/v1/livestock/herds').set(auth(tokenA));
    const batch = await request(app.getHttpServer())
      .post('/v1/livestock/batches')
      .set(auth(tokenA))
      .send({ herdId: herd.body[0].id, categoryId: cat.body[0].id, headCount: 10 })
      .expect(201);

    const payload = {
      events: [
        { clientUuid: `w-${uniq}`, entity: 'weighing', payload: { batchId: batch.body.id, weight: 280 } },
      ],
    };
    const first = await request(app.getHttpServer()).post('/v1/sync/batch').set(auth(tokenA)).send(payload).expect(201);
    const second = await request(app.getHttpServer()).post('/v1/sync/batch').set(auth(tokenA)).send(payload).expect(201);
    expect(first.body[0].status).toBe('applied');
    expect(second.body[0].status).toBe('applied');
    // Mismo id devuelto → no se duplicó
    expect(first.body[0].id).toBe(second.body[0].id);
  });

  // ─────────────── AISLAMIENTO DE TENANTS (crítico) ───────────────
  it('tenant B NO ve el stock ni establecimientos de A', async () => {
    const stockB = await request(app.getHttpServer()).get('/v1/livestock/stock').set(auth(tokenB)).expect(200);
    expect(stockB.body).toEqual([]);

    const estListB = await request(app.getHttpServer()).get('/v1/establishments').set(auth(tokenB)).expect(200);
    expect(estListB.body.find((e: any) => e.id === establishmentAId)).toBeUndefined();
  });

  it('tenant B NO puede acceder a un establecimiento de A por id (404)', async () => {
    await request(app.getHttpServer()).get(`/v1/establishments/${establishmentAId}`).set(auth(tokenB)).expect(404);
  });

  it('tenant B NO puede crear recursos colgando de entidades de A (404)', async () => {
    // Intento de crear un depósito en el establecimiento de A usando token de B.
    await request(app.getHttpServer())
      .post('/v1/inventory/warehouses')
      .set(auth(tokenB))
      .send({ establishmentId: establishmentAId, name: 'Intruso' })
      .expect(404);
  });
});
