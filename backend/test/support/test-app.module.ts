import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from '../../src/auth/auth.module';
import { ChecklistModule } from '../../src/checklist/checklist.module';
import { DashboardModule } from '../../src/dashboard/dashboard.module';
import { ExecucaoModule } from '../../src/execucao/execucao.module';
import { PrismaModule } from '../../src/prisma/prisma.module';
import { UsuariosModule } from '../../src/usuarios/usuarios.module';

/**
 * Test-only root module: the same feature modules real AppModule wires up,
 * without the global ThrottlerGuard (rate limiting has its own dedicated
 * test using the real AppModule instead - see throttling.e2e-spec.ts).
 * Keeping this list in sync with src/app.module.ts is the tradeoff for not
 * fighting Nest's global-guard multi-provider binding in every other test.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ChecklistModule,
    ExecucaoModule,
    UsuariosModule,
    DashboardModule,
  ],
})
export class TestAppModule {}
