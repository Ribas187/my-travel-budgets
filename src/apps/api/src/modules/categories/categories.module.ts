import { Module } from '@nestjs/common';

import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

import { CommonAuthModule } from '@/modules/common/auth';

@Module({
  imports: [CommonAuthModule],
  controllers: [CategoriesController],
  providers: [CategoriesService],
})
export class CategoriesModule {}
