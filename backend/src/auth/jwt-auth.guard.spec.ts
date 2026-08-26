import { describe, it } from '@jest/globals';
import { JwtAuthGuard } from './jwt-auth.guard';
import { expect } from '@jest/globals';

describe('JwtAuthGuard', () => {
  it('should be defined', () => {
    expect(new JwtAuthGuard()).toBeDefined();
  });
});
