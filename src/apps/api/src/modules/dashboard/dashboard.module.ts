import { Module } from '@nestjs/common';

import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { PrismaDashboardRepository } from './repository/dashboard.repository.prisma';

import { CommonAuthModule } from '@/modules/common/auth';
import { DASHBOARD_REPOSITORY } from '@/modules/common/database';

@Module({
  imports: [CommonAuthModule],
  controllers: [DashboardController],
  providers: [
    DashboardService,
    { provide: DASHBOARD_REPOSITORY, useClass: PrismaDashboardRepository },
  ],
})
export class DashboardModule {}
