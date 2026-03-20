import { Module } from '@nestjs/common'
import { CommonAuthModule } from '@/modules/common/auth'
import { TravelsController } from './travels.controller'
import { TravelsService } from './travels.service'

@Module({
  imports: [CommonAuthModule],
  controllers: [TravelsController],
  providers: [TravelsService],
})
export class TravelsModule {}
