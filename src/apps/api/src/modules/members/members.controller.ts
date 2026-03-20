import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common'
import {
  CheckPolicy,
  IsTravelOwnerPolicy,
  JwtAuthGuard,
  PolicyGuard,
  TravelMemberGuard,
} from '@/modules/common/auth'
import { MembersService } from './members.service'
import { AddMemberDto } from './dto/add-member.dto'

@Controller('travels/:travelId/members')
@UseGuards(JwtAuthGuard, TravelMemberGuard, PolicyGuard)
@CheckPolicy(IsTravelOwnerPolicy)
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async addMember(
    @Param('travelId') travelId: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.membersService.addMember(travelId, dto)
  }

  @Delete(':memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(
    @Param('travelId') travelId: string,
    @Param('memberId') memberId: string,
  ) {
    await this.membersService.removeMember(travelId, memberId)
  }
}
