import { z } from 'zod';

export const createExpenseSchema = z.object({
  categoryId: z.string().uuid(),
  memberId: z.string().uuid(),
  amount: z.number().positive(),
  description: z.string().min(1).max(500),
  date: z.string().date(),
});

export const updateExpenseSchema = z.object({
  categoryId: z.string().uuid().optional(),
  memberId: z.string().uuid().optional(),
  amount: z.number().positive().optional(),
  description: z.string().min(1).max(500).optional(),
  date: z.string().date().optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
