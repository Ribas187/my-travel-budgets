import { describe, it, expect } from 'vitest';

import { createExpenseSchema, updateExpenseSchema } from '../expense';

describe('Expense schemas', () => {
  it('validates a valid create expense payload', () => {
    const result = createExpenseSchema.safeParse({
      categoryId: '550e8400-e29b-41d4-a716-446655440000',
      memberId: '550e8400-e29b-41d4-a716-446655440001',
      amount: 45.5,
      description: 'Dinner at restaurant',
      date: '2026-06-05',
    });
    expect(result.success).toBe(true);
  });

  it('rejects zero amount', () => {
    const result = createExpenseSchema.safeParse({
      categoryId: '550e8400-e29b-41d4-a716-446655440000',
      memberId: '550e8400-e29b-41d4-a716-446655440001',
      amount: 0,
      description: 'Free thing',
      date: '2026-06-05',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid UUID for categoryId', () => {
    const result = createExpenseSchema.safeParse({
      categoryId: 'not-a-uuid',
      memberId: '550e8400-e29b-41d4-a716-446655440001',
      amount: 10,
      description: 'Test',
      date: '2026-06-05',
    });
    expect(result.success).toBe(false);
  });

  it('validates update with partial fields', () => {
    const result = updateExpenseSchema.safeParse({
      amount: 50,
      description: 'Updated description',
    });
    expect(result.success).toBe(true);
  });
});
