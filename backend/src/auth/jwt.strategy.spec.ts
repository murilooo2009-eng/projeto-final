import { JwtStrategy } from './jwt.strategy';
import { ConfigService } from '@nestjs/config';

describe('JwtStrategy', () => {
  it('should be defined', () => {
    const mockConfigService = {
      get: jest.fn().mockReturnValue('test-secret'),
    } as unknown as ConfigService;

    const strategy = new JwtStrategy(mockConfigService);

    expect(strategy).toBeDefined();
  });
});