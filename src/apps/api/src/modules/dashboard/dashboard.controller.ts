import { Controller, Get, Param, UseGuards } from '@nestjs/common'
import { JwtAuthGuard, TravelMemberGuard } from '@/modules/common/auth'
import { DashboardService } from './dashboard.service'

@Controller('travels/:travelId/dashboard')
@UseGuards(JwtAuthGuard, TravelMemberGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async getDashboard(@Param('travelId') travelId: string) {
    return this.dashboardService.getDashboard(travelId)
  }
}
