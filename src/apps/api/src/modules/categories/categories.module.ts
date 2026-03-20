import { Module } from '@nestjs/common'
import { CommonAuthModule } from '@/modules/common/auth'
import { CategoriesController } from './categories.controller'
import { CategoriesService } from './categories.service'

@Module({
  imports: [CommonAuthModule],
  controllers: [CategoriesController],
  providers: [CategoriesService],
})
export class CategoriesModule {}
