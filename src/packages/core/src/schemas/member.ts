import { z } from 'zod'

export const addMemberSchema = z
  .object({
    email: z.string().email().optional(),
    guestName: z.string().min(1).max(100).optional(),
  })
  .refine((data) => {
    const hasEmail = data.email !== undefined
    const hasGuest = data.guestName !== undefined
    return (hasEmail || hasGuest) && !(hasEmail && hasGuest)
  }, 'Provide either email or guestName, not both')

export type AddMemberInput = z.infer<typeof addMemberSchema>
