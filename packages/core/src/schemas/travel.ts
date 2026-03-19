import { z } from 'zod'
import { SUPPORTED_CURRENCIES } from '../constants/currencies'

const currencyCodes = SUPPORTED_CURRENCIES.map((c) => c.code) as [string, ...string[]]

export const createTravelSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  currency: z.enum(currencyCodes),
  budget: z.number().positive(),
  startDate: z.string().date(),
  endDate: z.string().date(),
})

export const updateTravelSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  currency: z.enum(currencyCodes).optional(),
  budget: z.number().positive().optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
})

export type CreateTravelInput = z.infer<typeof createTravelSchema>
export type UpdateTravelInput = z.infer<typeof updateTravelSchema>
