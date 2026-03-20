import { Module } from '@nestjs/common';

import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

import { CommonAuthModule } from '@/modules/common/auth';

@Module({
  imports: [CommonAuthModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
