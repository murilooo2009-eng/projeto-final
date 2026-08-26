import { describe, it } from '@jest/globals';
import { JwtStrategy } from './jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { expect, jest } from '@jest/globals';

describe('JwtStrategy', () => {
  it('should be defined', () => {
    const mockConfigService = {
      get: jest.fn().mockReturnValue('test-secret'),
    } as unknown as ConfigService;

    const strategy = new JwtStrategy(mockConfigService);

    expect(strategy).toBeDefined();
  });
});