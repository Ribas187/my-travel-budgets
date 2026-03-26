import { config as loadEnv } from 'dotenv';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';

import { validateEnv } from '@/config/env.validation';
import { PrismaModule } from '@/modules/prisma/prisma.module';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { DashboardService } from '@/modules/dashboard/dashboard.service';
import { PrismaDashboardRepository } from '@/modules/dashboard/repository/dashboard.repository.prisma';
import { DASHBOARD_REPOSITORY } from '@/modules/common/database';

describe('Dashboard integration tests', () => {
  let moduleRef: TestingModule;
  let prisma: PrismaService;
  let dashboardService: DashboardService;

  beforeAll(async () => {
    loadEnv({ path: '.env.local', quiet: true });
    loadEnv({ path: '.env', quiet: true });

    const required: Record<string, string> = {
      DATABASE_URL: process.env.DATABASE_URL ?? '',
      JWT_SECRET: process.env.JWT_SECRET ?? 'integration-test-secret-min-32-chars!!',
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '30d',
      RESEND_API_KEY: process.env.RESEND_API_KEY ?? 're_integration_placeholder',
      PORT: process.env.PORT ?? '3000',
    };
    for (const [key, value] of Object.entries(required)) {
      if (!process.env[key]) process.env[key] = value;
    }
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL must be set (or present in .env) for integration tests');
    }

    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          validate: validateEnv,
          envFilePath: ['.env.local', '.env'],
        }),
        PrismaModule,
      ],
      providers: [
        DashboardService,
        { provide: DASHBOARD_REPOSITORY, useClass: PrismaDashboardRepository },
      ],
    }).compile();

    await moduleRef.init();
    prisma = moduleRef.get(PrismaService);
    dashboardService = moduleRef.get(DashboardService);
  });

  afterAll(async () => {
    await moduleRef?.close();
  });

  afterEach(async () => {
    await prisma.expense.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.travelMember.deleteMany({});
    await prisma.travel.deleteMany({});
    await prisma.user.deleteMany({});
  });

  async function createUser(email: string, name?: string) {
    return prisma.user.create({
      data: { email, name: name ?? email.split('@')[0] },
    });
  }

  async function createTravelWithOwner(
    userId: string,
    overrides: { budget?: number; currency?: string } = {},
  ) {
    const travel = await prisma.travel.create({
      data: {
        name: 'Test Trip',
        currency: overrides.currency ?? 'EUR',
        budget: overrides.budget ?? 5000,
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-15'),
        createdById: userId,
      },
    });

    const ownerMember = await prisma.travelMember.create({
      data: { travelId: travel.id, userId, role: 'owner' },
    });

    return { travel, ownerMember };
  }

  async function createGuestMember(travelId: string, guestName: string) {
    return prisma.travelMember.create({
      data: { travelId, guestName, role: 'member' },
    });
  }

  async function createMember(travelId: string, userId: string) {
    return prisma.travelMember.create({
      data: { travelId, userId, role: 'member' },
    });
  }

  async function createCategory(
    travelId: string,
    name: string,
    opts: { budgetLimit?: number; icon?: string; color?: string } = {},
  ) {
    return prisma.category.create({
      data: {
        travelId,
        name,
        icon: opts.icon ?? 'tag',
        color: opts.color ?? '#000000',
        budgetLimit: opts.budgetLimit ?? null,
      },
    });
  }

  async function createExpense(
    travelId: string,
    memberId: string,
    categoryId: string,
    amount: number,
  ) {
    return prisma.expense.create({
      data: {
        travelId,
        memberId,
        categoryId,
        amount,
        description: 'Test expense',
        date: new Date('2026-06-05'),
      },
    });
  }

  it('returns correct aggregation totals matching manual sums', async () => {
    const user = await createUser('alice@test.com', 'Alice');
    const { travel, ownerMember } = await createTravelWithOwner(user.id, {
      budget: 5000,
      currency: 'EUR',
    });

    const user2 = await createUser('bob@test.com', 'Bob');
    const member2 = await createMember(travel.id, user2.id);

    const food = await createCategory(travel.id, 'Food', { budgetLimit: 1000 });
    const transport = await createCategory(travel.id, 'Transport', {
      budgetLimit: 500,
    });

    await createExpense(travel.id, ownerMember.id, food.id, 300);
    await createExpense(travel.id, ownerMember.id, transport.id, 100);
    await createExpense(travel.id, member2.id, food.id, 200);

    const result = await dashboardService.getDashboard(travel.id);

    // Member spending
    const alice = result.memberSpending.find((m) => m.memberId === ownerMember.id);
    const bob = result.memberSpending.find((m) => m.memberId === member2.id);
    expect(alice?.totalSpent).toBe(400);
    expect(bob?.totalSpent).toBe(200);

    // Category spending
    const foodCat = result.categorySpending.find((c) => c.categoryId === food.id);
    const transportCat = result.categorySpending.find((c) => c.categoryId === transport.id);
    expect(foodCat?.totalSpent).toBe(500);
    expect(transportCat?.totalSpent).toBe(100);

    // Overall
    expect(result.overall.totalSpent).toBe(600);
    expect(result.overall.budget).toBe(5000);
  });

  it('includes members with zero expenses with totalSpent: 0', async () => {
    const user = await createUser('alice@test.com', 'Alice');
    const { travel } = await createTravelWithOwner(user.id);
    const guest = await createGuestMember(travel.id, 'Guest Bob');
    await createCategory(travel.id, 'Food');

    const result = await dashboardService.getDashboard(travel.id);

    const guestEntry = result.memberSpending.find((m) => m.memberId === guest.id);
    expect(guestEntry).toBeDefined();
    expect(guestEntry?.totalSpent).toBe(0);
    expect(guestEntry?.displayName).toBe('Guest Bob');
  });

  it('includes categories with zero expenses with totalSpent: 0', async () => {
    const user = await createUser('alice@test.com', 'Alice');
    const { travel } = await createTravelWithOwner(user.id);
    const emptyCategory = await createCategory(travel.id, 'Shopping');

    const result = await dashboardService.getDashboard(travel.id);

    const cat = result.categorySpending.find((c) => c.categoryId === emptyCategory.id);
    expect(cat).toBeDefined();
    expect(cat?.totalSpent).toBe(0);
  });

  it('returns correct currency from the travel', async () => {
    const user = await createUser('alice@test.com', 'Alice');
    const { travel } = await createTravelWithOwner(user.id, {
      currency: 'BRL',
    });

    const result = await dashboardService.getDashboard(travel.id);

    expect(result.currency).toBe('BRL');
  });

  it('computes alert statuses correctly (ok → warning → exceeded)', async () => {
    const user = await createUser('alice@test.com', 'Alice');
    const { travel, ownerMember } = await createTravelWithOwner(user.id, {
      budget: 1000,
    });

    const category = await createCategory(travel.id, 'Food', {
      budgetLimit: 100,
    });

    // 70% of limit → ok
    await createExpense(travel.id, ownerMember.id, category.id, 70);
    let result = await dashboardService.getDashboard(travel.id);
    let foodCat = result.categorySpending.find((c) => c.categoryId === category.id);
    expect(foodCat?.status).toBe('ok');

    // Add 10 more → 80% of limit → warning
    await createExpense(travel.id, ownerMember.id, category.id, 10);
    result = await dashboardService.getDashboard(travel.id);
    foodCat = result.categorySpending.find((c) => c.categoryId === category.id);
    expect(foodCat?.status).toBe('warning');

    // Add 20 more → 100% of limit → exceeded
    await createExpense(travel.id, ownerMember.id, category.id, 20);
    result = await dashboardService.getDashboard(travel.id);
    foodCat = result.categorySpending.find((c) => c.categoryId === category.id);
    expect(foodCat?.status).toBe('exceeded');
  });

  it('computes overall budget alert status correctly', async () => {
    const user = await createUser('alice@test.com', 'Alice');
    const { travel, ownerMember } = await createTravelWithOwner(user.id, {
      budget: 1000,
    });

    const category = await createCategory(travel.id, 'Food');

    // 50% of budget → ok
    await createExpense(travel.id, ownerMember.id, category.id, 500);
    let result = await dashboardService.getDashboard(travel.id);
    expect(result.overall.status).toBe('ok');

    // 80% of budget → warning
    await createExpense(travel.id, ownerMember.id, category.id, 300);
    result = await dashboardService.getDashboard(travel.id);
    expect(result.overall.status).toBe('warning');

    // 100%+ of budget → exceeded
    await createExpense(travel.id, ownerMember.id, category.id, 200);
    result = await dashboardService.getDashboard(travel.id);
    expect(result.overall.status).toBe('exceeded');
  });
});
