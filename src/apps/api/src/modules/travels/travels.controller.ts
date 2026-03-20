import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import { TravelsService } from './travels.service';
import { CreateTravelDto } from './dto/create-travel.dto';
import { UpdateTravelDto } from './dto/update-travel.dto';

import {
  CheckPolicy,
  CurrentUser,
  IsTravelOwnerPolicy,
  JwtAuthGuard,
  PolicyGuard,
  TravelMemberGuard,
  type JwtAuthUser,
} from '@/modules/common/auth';

@Controller('travels')
export class TravelsController {
  constructor(private readonly travelsService: TravelsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async create(@CurrentUser() user: JwtAuthUser, @Body() dto: CreateTravelDto) {
    return this.travelsService.createTravel(user.userId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@CurrentUser() user: JwtAuthUser) {
    return this.travelsService.findAllByUser(user.userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, TravelMemberGuard)
  async findOne(@Param('id') id: string) {
    return this.travelsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, TravelMemberGuard, PolicyGuard)
  @CheckPolicy(IsTravelOwnerPolicy)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async update(@Param('id') id: string, @Body() dto: UpdateTravelDto) {
    return this.travelsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, TravelMemberGuard, PolicyGuard)
  @CheckPolicy(IsTravelOwnerPolicy)
  async remove(@Param('id') id: string) {
    await this.travelsService.remove(id);
  }
}
