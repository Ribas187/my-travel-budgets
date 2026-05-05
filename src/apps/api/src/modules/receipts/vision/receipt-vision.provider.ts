import type { ExtractedReceipt } from '@repo/core';

export type ReceiptImageMimeType = 'image/jpeg' | 'image/png';

export interface IReceiptVisionProvider {
  extract(image: Buffer, mimeType: ReceiptImageMimeType): Promise<ExtractedReceipt>;
}

export const RECEIPT_VISION_PROVIDER = Symbol('RECEIPT_VISION_PROVIDER');
