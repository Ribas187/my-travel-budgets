import { Inject, Injectable } from '@nestjs/common';
import type { ExtractedReceipt } from '@repo/core';

import {
  RECEIPT_VISION_PROVIDER,
  type IReceiptVisionProvider,
  type ReceiptImageMimeType,
} from './vision/receipt-vision.provider';

@Injectable()
export class ReceiptsService {
  constructor(
    @Inject(RECEIPT_VISION_PROVIDER)
    private readonly vision: IReceiptVisionProvider,
  ) {}

  async extractFromUpload(file: Express.Multer.File): Promise<ExtractedReceipt> {
    return this.vision.extract(file.buffer, file.mimetype as ReceiptImageMimeType);
  }
}
