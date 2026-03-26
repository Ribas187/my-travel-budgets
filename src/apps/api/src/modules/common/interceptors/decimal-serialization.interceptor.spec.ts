import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { of } from 'rxjs';

const Decimal = Prisma.Decimal;

import { DecimalSerializationInterceptor } from './decimal-serialization.interceptor';

describe('DecimalSerializationInterceptor', () => {
  let interceptor: DecimalSerializationInterceptor;
  const mockContext = {} as ExecutionContext;

  beforeEach(() => {
    interceptor = new DecimalSerializationInterceptor();
  });

  function intercept(data: unknown): Promise<unknown> {
    const handler: CallHandler = { handle: () => of(data) };
    return new Promise((resolve) => {
      interceptor.intercept(mockContext, handler).subscribe(resolve);
    });
  }

  it('should convert a Decimal to a number', async () => {
    const result = await intercept({ amount: new Decimal('99.99') });
    expect(result).toEqual({ amount: 99.99 });
  });

  it('should convert nested Decimals', async () => {
    const result = await intercept({
      travel: { budget: new Decimal('5000.50'), name: 'Trip' },
    });
    expect(result).toEqual({
      travel: { budget: 5000.5, name: 'Trip' },
    });
  });

  it('should convert Decimals in arrays', async () => {
    const result = await intercept({
      expenses: [
        { amount: new Decimal('10.00') },
        { amount: new Decimal('20.50') },
      ],
    });
    expect(result).toEqual({
      expenses: [{ amount: 10 }, { amount: 20.5 }],
    });
  });

  it('should preserve Date objects', async () => {
    const date = new Date('2025-01-01');
    const result = await intercept({ createdAt: date });
    expect(result).toEqual({ createdAt: date });
  });

  it('should pass through primitives unchanged', async () => {
    const result = await intercept({ name: 'test', count: 5, active: true });
    expect(result).toEqual({ name: 'test', count: 5, active: true });
  });

  it('should handle null and undefined values', async () => {
    const result = await intercept({ a: null, b: undefined });
    expect(result).toEqual({ a: null, b: undefined });
  });

  it('should handle plain numbers (no double-conversion)', async () => {
    const result = await intercept({ amount: 42.5 });
    expect(result).toEqual({ amount: 42.5 });
  });
});
