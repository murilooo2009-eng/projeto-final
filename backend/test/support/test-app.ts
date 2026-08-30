import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

import { FakePrismaService } from './fake-prisma';
import { TestAppModule } from './test-app.module';

/**
 * Boots the application (real guards, pipes, controllers, services) with
 * PrismaService replaced by a fresh in-memory FakePrismaService.
 *
 * Uses TestAppModule (same feature modules as AppModule, minus the global
 * ThrottlerGuard) so a full functional/security suite can call
 * /auth/login and /auth/register more than 5 times without being rate
 * limited by a guard meant for real traffic. Rate limiting itself is
 * covered separately by throttling.e2e-spec.ts, which boots the real
 * AppModule instead.
 *
 * JWT_SECRET is set here purely so AuthModule's JwtModule/JwtStrategy have
 * something to read in this sandbox; it is never a real secret.
 */
export async function createTestApp(): Promise<{
  app: INestApplication;
  prisma: FakePrismaService;
}> {
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-only-secret-do-not-use-in-prod';

  const prisma = new FakePrismaService();

  const moduleRef = await Test.createTestingModule({
    imports: [TestAppModule],
  })
    .overrideProvider(PrismaService)
    .useValue(prisma)
    .compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.init();

  return { app, prisma };
}

/** Boots the *real* AppModule, throttler included, for testing rate limiting itself. */
export async function createTestAppWithThrottling(): Promise<{
  app: INestApplication;
  prisma: FakePrismaService;
}> {
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-only-secret-do-not-use-in-prod';

  const prisma = new FakePrismaService();

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PrismaService)
    .useValue(prisma)
    .compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  await app.init();

  return { app, prisma };
}
