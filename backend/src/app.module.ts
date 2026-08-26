import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';

import { PrismaModule } from './common/prisma/prisma.module';
import { AuthCoreModule } from './common/auth/auth-core.module';
import { AuthGuard } from './common/auth/auth.guard';
import { RolesGuard } from './common/auth/roles.guard';
import { ProblemFilter } from './common/errors/problem.filter';
import { TenantContextMiddleware } from './common/auth/tenant-context.middleware';

import { HealthController } from './health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { OrgModule } from './modules/org/org.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { LivestockModule } from './modules/livestock/livestock.module';
import { AgricultureModule } from './modules/agriculture/agriculture.module';
import { MachineryModule } from './modules/machinery/machinery.module';
import { BreedingModule } from './modules/breeding/breeding.module';
import { FeedlotModule } from './modules/feedlot/feedlot.module';
import { DairyModule } from './modules/dairy/dairy.module';
import { FinanceModule } from './modules/finance/finance.module';
import { ServicesModule } from './modules/services/services.module';
import { IotModule } from './modules/iot/iot.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AiModule } from './modules/ai/ai.module';
import { SyncModule } from './modules/sync/sync.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthCoreModule,
    AuthModule,
    OrgModule,
    InventoryModule,
    LivestockModule,
    AgricultureModule,
    MachineryModule,
    BreedingModule,
    FeedlotModule,
    DairyModule,
    FinanceModule,
    ServicesModule,
    IotModule,
    ReportsModule,
    AiModule,
    SyncModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: ProblemFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Establece el contexto de tenant (desde el JWT) para todas las rutas.
    consumer.apply(TenantContextMiddleware).forRoutes('*');
  }
}
