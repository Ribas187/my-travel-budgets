import { Controller, Get, Param, UseGuards } from '@nestjs/common';

import { DashboardService } from './dashboard.service';

import { JwtAuthGuard, TravelMemberGuard } from '@/modules/common/auth';

@Controller('travels/:travelId/dashboard')
@UseGuards(JwtAuthGuard, TravelMemberGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async getDashboard(@Param('travelId') travelId: string) {
    return this.dashboardService.getDashboard(travelId);
  }
}
