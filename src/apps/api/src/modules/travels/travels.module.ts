import { Module } from '@nestjs/common';

import { TravelsController } from './travels.controller';
import { TravelsService } from './travels.service';

import { CommonAuthModule } from '@/modules/common/auth';

@Module({
  imports: [CommonAuthModule],
  controllers: [TravelsController],
  providers: [TravelsService],
})
export class TravelsModule {}
