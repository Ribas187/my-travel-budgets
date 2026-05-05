import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ReceiptsController } from './receipts.controller';
import { ReceiptsService } from './receipts.service';
import {
  RECEIPT_VISION_PROVIDER,
  type IReceiptVisionProvider,
} from './vision/receipt-vision.provider';
import { StubReceiptVisionProvider } from './vision/receipt-vision.stub';
import { OpenRouterReceiptVisionProvider } from './vision/receipt-vision.openrouter';

import { CommonAuthModule } from '@/modules/common/auth';

export function createReceiptVisionProvider(config: ConfigService): IReceiptVisionProvider {
  const apiKey = config.get<string>('OPENROUTER_API_KEY');
  if (!apiKey || apiKey.length === 0) {
    return new StubReceiptVisionProvider();
  }
  const model = config.get<string>('RECEIPT_VISION_MODEL');
  return new OpenRouterReceiptVisionProvider({ apiKey, model });
}

@Module({
  imports: [CommonAuthModule],
  controllers: [ReceiptsController],
  providers: [
    ReceiptsService,
    {
      provide: RECEIPT_VISION_PROVIDER,
      inject: [ConfigService],
      useFactory: createReceiptVisionProvider,
    },
  ],
})
export class ReceiptsModule {}
