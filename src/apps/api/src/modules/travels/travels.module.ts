import { Module } from '@nestjs/common';

import { TravelsController } from './travels.controller';
import { TravelsService } from './travels.service';
import { PrismaTravelRepository } from './repository/travel.repository.prisma';

import { CommonAuthModule } from '@/modules/common/auth';
import { TRAVEL_REPOSITORY } from '@/modules/common/database';

@Module({
  imports: [CommonAuthModule],
  controllers: [TravelsController],
  providers: [
    TravelsService,
    { provide: TRAVEL_REPOSITORY, useClass: PrismaTravelRepository },
  ],
})
export class TravelsModule {}
