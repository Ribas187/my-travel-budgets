import { Injectable } from '@nestjs/common';
import type { ExtractedReceipt } from '@repo/core';

import type {
  IReceiptVisionProvider,
  ReceiptImageMimeType,
} from './receipt-vision.provider';

@Injectable()
export class StubReceiptVisionProvider implements IReceiptVisionProvider {
  extract(_image: Buffer, _mimeType: ReceiptImageMimeType): Promise<ExtractedReceipt> {
    return Promise.resolve({
      total: 12.34,
      date: '2026-05-05',
      merchant: 'Stub Café',
    });
  }
}
