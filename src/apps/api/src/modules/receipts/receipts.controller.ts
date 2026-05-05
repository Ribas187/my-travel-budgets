import {
  Controller,
  HttpCode,
  HttpStatus,
  ParseFilePipeBuilder,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { ExtractedReceipt } from '@repo/core';

import { ReceiptsService } from './receipts.service';

import { JwtAuthGuard, TravelMemberGuard } from '@/modules/common/auth';

const MAX_RECEIPT_SIZE = 15 * 1024 * 1024;

@Controller('travels/:travelId/receipts')
@UseGuards(JwtAuthGuard, TravelMemberGuard)
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @Post('extract')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('image'))
  async extract(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: /(jpeg|jpg|png)$/i, fallbackToMimetype: true })
        .addMaxSizeValidator({ maxSize: MAX_RECEIPT_SIZE })
        .build({ errorHttpStatusCode: HttpStatus.BAD_REQUEST }),
    )
    file: Express.Multer.File,
  ): Promise<ExtractedReceipt> {
    return this.receiptsService.extractFromUpload(file);
  }
}
