import { Module } from '@nestjs/common'
import { CommonAuthModule } from '@/modules/common/auth'
import { DashboardController } from './dashboard.controller'
import { DashboardService } from './dashboard.service'

@Module({
  imports: [CommonAuthModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
