import { Module } from '@nestjs/common';

import { ReceiptsController } from './receipts.controller';
import { ReceiptsService } from './receipts.service';
import { RECEIPT_VISION_PROVIDER } from './vision/receipt-vision.provider';
import { StubReceiptVisionProvider } from './vision/receipt-vision.stub';

import { CommonAuthModule } from '@/modules/common/auth';

@Module({
  imports: [CommonAuthModule],
  controllers: [ReceiptsController],
  providers: [
    ReceiptsService,
    { provide: RECEIPT_VISION_PROVIDER, useClass: StubReceiptVisionProvider },
  ],
})
export class ReceiptsModule {}
