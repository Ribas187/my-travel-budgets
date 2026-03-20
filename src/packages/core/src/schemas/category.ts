import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  budgetLimit: z.number().positive().nullable().optional(),
  icon: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  budgetLimit: z.number().positive().nullable().optional(),
  icon: z.string().min(1).max(50).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
