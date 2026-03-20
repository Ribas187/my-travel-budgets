import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { validateEnv } from './config/env.validation';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { EmailModule } from './modules/common/email/email.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { TravelsModule } from './modules/travels/travels.module';
import { MembersModule } from './modules/members/members.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    EmailModule,
    AuthModule,
    UsersModule,
    TravelsModule,
    MembersModule,
    CategoriesModule,
    ExpensesModule,
    DashboardModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
