import { z } from 'zod';

export const extractedReceiptSchema = z.object({
  total: z.number().positive().nullable(),
  date: z.string().date().nullable(),
  merchant: z.string().min(1).max(120).nullable(),
});

export type ExtractedReceipt = z.infer<typeof extractedReceiptSchema>;

export const extractedReceiptJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['total', 'date', 'merchant'],
  properties: {
    total: {
      type: ['number', 'null'],
      description:
        'Total amount in the receipt currency as a positive number (e.g. 12.34). Use null when the total cannot be read with confidence.',
    },
    date: {
      type: ['string', 'null'],
      description:
        "Purchase date as ISO 'yyyy-MM-dd'. Use null when the date cannot be read with confidence.",
    },
    merchant: {
      type: ['string', 'null'],
      description:
        'Merchant name exactly as printed on the receipt (1 to 120 characters). Use null when the merchant cannot be identified.',
    },
  },
} as const;
