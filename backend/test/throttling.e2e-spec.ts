import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { createTestAppWithThrottling } from './support/test-app';

/**
 * Uses the *real* AppModule (unlike every other e2e file here, which uses
 * TestAppModule without the global ThrottlerGuard) specifically to prove the
 * rate limit on /auth/login and /auth/register actually engages.
 */
describe('Throttling (e2e)', () => {
  let app: INestApplication;
  let api: ReturnType<typeof request>;

  beforeAll(async () => {
    ({ app } = await createTestAppWithThrottling());
    api = request(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
  });

  it('blocks login attempts after the configured limit (5 per minute) with 429', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) {
      const res = await api.post('/api/auth/login').send({ email: 'ninguem@empresa.com', senha: 'x' });
      statuses.push(res.status);
    }
    expect(statuses.slice(0, 5)).toEqual([401, 401, 401, 401, 401]);
    expect(statuses[5]).toBe(429);
  });
});
