import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TenantMiddleware } from './common/tenant/tenant.middleware';
import { PrismaModule } from './common/prisma/prisma.module';
import { LivestockModule } from './modules/livestock/livestock.module';
// import { OrgModule } from './modules/org/org.module';
// import { InventoryModule } from './modules/inventory/inventory.module';
// import { AgricultureModule } from './modules/agriculture/agriculture.module';
// import { AiModule } from './modules/ai/ai.module';
// import { SyncModule } from './modules/sync/sync.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    LivestockModule,
    // OrgModule, InventoryModule, AgricultureModule, AiModule, SyncModule, ...
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Fija el contexto de tenant (desde el JWT) para todas las rutas.
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
