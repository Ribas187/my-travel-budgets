import { config as loadEnv } from 'dotenv';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';

import { validateEnv } from '@/config/env.validation';
import { PrismaModule } from '@/modules/prisma/prisma.module';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { ExpensesService } from '@/modules/expenses/expenses.service';
import { PrismaExpenseRepository } from '@/modules/expenses/repository/expense.repository.prisma';
import { EXPENSE_REPOSITORY } from '@/modules/common/database';
import { BusinessValidationError, ForbiddenError } from '@/modules/common/exceptions';

describe('Expenses integration tests', () => {
  let moduleRef: TestingModule;
  let prisma: PrismaService;
  let expensesService: ExpensesService;

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
        ExpensesService,
        { provide: EXPENSE_REPOSITORY, useClass: PrismaExpenseRepository },
      ],
    }).compile();

    await moduleRef.init();
    prisma = moduleRef.get(PrismaService);
    expensesService = moduleRef.get(ExpensesService);
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

  async function createUser(email: string) {
    return prisma.user.create({
      data: { email, name: email.split('@')[0] },
    });
  }

  async function createTravelWithOwner(userId: string) {
    const travel = await prisma.travel.create({
      data: {
        name: 'Test Trip',
        currency: 'USD',
        budget: 3000,
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

  async function createCategory(travelId: string, name = 'Food') {
    return prisma.category.create({
      data: { travelId, name, icon: 'utensils', color: '#FF0000' },
    });
  }

  async function createMember(travelId: string, userId: string) {
    return prisma.travelMember.create({
      data: { travelId, userId, role: 'member' },
    });
  }

  describe('create', () => {
    it('creates an expense and auto-sets memberId', async () => {
      const owner = await createUser('owner@test.com');
      const { travel, ownerMember } = await createTravelWithOwner(owner.id);
      const category = await createCategory(travel.id);

      const expense = await expensesService.create(travel.id, ownerMember.id, {
        categoryId: category.id,
        amount: 50,
        description: 'Lunch',
        date: '2026-06-02',
      });

      expect(expense).toBeDefined();
      expect(expense.memberId).toBe(ownerMember.id);
      expect(expense.travelId).toBe(travel.id);
      expect(expense.categoryId).toBe(category.id);
      expect(Number(expense.amount)).toBe(50);
      expect(expense.description).toBe('Lunch');
    });

    it('throws BusinessValidationError when categoryId does not belong to travel', async () => {
      const owner = await createUser('owner@test.com');
      const { travel, ownerMember } = await createTravelWithOwner(owner.id);

      // Create a category in a different travel
      const owner2 = await createUser('owner2@test.com');
      const { travel: travel2 } = await createTravelWithOwner(owner2.id);
      const otherCategory = await createCategory(travel2.id);

      await expect(
        expensesService.create(travel.id, ownerMember.id, {
          categoryId: otherCategory.id,
          amount: 50,
          description: 'Lunch',
          date: '2026-06-02',
        }),
      ).rejects.toThrow(BusinessValidationError);
    });
  });

  describe('findAll', () => {
    it('returns all expenses for a travel ordered by date descending', async () => {
      const owner = await createUser('owner@test.com');
      const { travel, ownerMember } = await createTravelWithOwner(owner.id);
      const category = await createCategory(travel.id);

      await expensesService.create(travel.id, ownerMember.id, {
        categoryId: category.id,
        amount: 30,
        description: 'Breakfast',
        date: '2026-06-01',
      });
      await expensesService.create(travel.id, ownerMember.id, {
        categoryId: category.id,
        amount: 50,
        description: 'Lunch',
        date: '2026-06-03',
      });

      const result = await expensesService.findAll(travel.id, {});

      expect(result.data).toHaveLength(2);
      expect(result.data[0].description).toBe('Lunch'); // most recent first
      expect(result.data[1].description).toBe('Breakfast');
    });

    it('filters by categoryId', async () => {
      const owner = await createUser('owner@test.com');
      const { travel, ownerMember } = await createTravelWithOwner(owner.id);
      const cat1 = await createCategory(travel.id, 'Food');
      const cat2 = await createCategory(travel.id, 'Transport');

      await expensesService.create(travel.id, ownerMember.id, {
        categoryId: cat1.id,
        amount: 50,
        description: 'Lunch',
        date: '2026-06-02',
      });
      await expensesService.create(travel.id, ownerMember.id, {
        categoryId: cat2.id,
        amount: 20,
        description: 'Bus',
        date: '2026-06-02',
      });

      const result = await expensesService.findAll(travel.id, { categoryId: cat1.id });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].description).toBe('Lunch');
    });

    it('filters by memberId', async () => {
      const owner = await createUser('owner@test.com');
      const { travel, ownerMember } = await createTravelWithOwner(owner.id);
      const member2User = await createUser('member2@test.com');
      const member2 = await createMember(travel.id, member2User.id);
      const category = await createCategory(travel.id);

      await expensesService.create(travel.id, ownerMember.id, {
        categoryId: category.id,
        amount: 50,
        description: 'Owner expense',
        date: '2026-06-02',
      });
      await expensesService.create(travel.id, member2.id, {
        categoryId: category.id,
        amount: 30,
        description: 'Member expense',
        date: '2026-06-02',
      });

      const result = await expensesService.findAll(travel.id, { memberId: member2.id });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].description).toBe('Member expense');
    });

    it('filters by date range', async () => {
      const owner = await createUser('owner@test.com');
      const { travel, ownerMember } = await createTravelWithOwner(owner.id);
      const category = await createCategory(travel.id);

      await expensesService.create(travel.id, ownerMember.id, {
        categoryId: category.id,
        amount: 20,
        description: 'Before range',
        date: '2026-05-30',
      });
      await expensesService.create(travel.id, ownerMember.id, {
        categoryId: category.id,
        amount: 50,
        description: 'In range',
        date: '2026-06-05',
      });
      await expensesService.create(travel.id, ownerMember.id, {
        categoryId: category.id,
        amount: 40,
        description: 'After range',
        date: '2026-06-20',
      });

      const result = await expensesService.findAll(travel.id, {
        startDate: '2026-06-01',
        endDate: '2026-06-15',
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].description).toBe('In range');
    });

    it('returns correct pagination metadata', async () => {
      const owner = await createUser('owner@test.com');
      const { travel, ownerMember } = await createTravelWithOwner(owner.id);
      const category = await createCategory(travel.id);

      // Create 5 expenses
      for (let i = 1; i <= 5; i++) {
        await expensesService.create(travel.id, ownerMember.id, {
          categoryId: category.id,
          amount: i * 10,
          description: `Expense ${i}`,
          date: `2026-06-0${i}`,
        });
      }

      const result = await expensesService.findAll(travel.id, { page: 2, limit: 2 });

      expect(result.meta.page).toBe(2);
      expect(result.meta.limit).toBe(2);
      expect(result.meta.total).toBe(5);
      expect(result.meta.totalPages).toBe(3);
      expect(result.data).toHaveLength(2);
    });

    it('returns correct total and totalPages for last partial page', async () => {
      const owner = await createUser('owner@test.com');
      const { travel, ownerMember } = await createTravelWithOwner(owner.id);
      const category = await createCategory(travel.id);

      for (let i = 1; i <= 3; i++) {
        await expensesService.create(travel.id, ownerMember.id, {
          categoryId: category.id,
          amount: 10,
          description: `Expense ${i}`,
          date: '2026-06-02',
        });
      }

      const result = await expensesService.findAll(travel.id, { page: 1, limit: 2 });

      expect(result.meta.total).toBe(3);
      expect(result.meta.totalPages).toBe(2);
    });
  });

  describe('update', () => {
    it('allows a member to update their own expense', async () => {
      const owner = await createUser('owner@test.com');
      const { travel, ownerMember } = await createTravelWithOwner(owner.id);
      const category = await createCategory(travel.id);

      const expense = await expensesService.create(travel.id, ownerMember.id, {
        categoryId: category.id,
        amount: 50,
        description: 'Lunch',
        date: '2026-06-02',
      });

      const updated = await expensesService.update(expense.id, ownerMember, {
        description: 'Updated Lunch',
        amount: 60,
      });

      expect(updated.description).toBe('Updated Lunch');
      expect(Number(updated.amount)).toBe(60);
    });

    it("allows the owner to update another member's expense (owner override)", async () => {
      const ownerUser = await createUser('owner@test.com');
      const { travel, ownerMember } = await createTravelWithOwner(ownerUser.id);
      const memberUser = await createUser('member@test.com');
      const member = await createMember(travel.id, memberUser.id);
      const category = await createCategory(travel.id);

      const expense = await expensesService.create(travel.id, member.id, {
        categoryId: category.id,
        amount: 50,
        description: 'Member expense',
        date: '2026-06-02',
      });

      const updated = await expensesService.update(expense.id, ownerMember, {
        description: 'Owner corrected',
      });

      expect(updated.description).toBe('Owner corrected');
    });

    it("throws ForbiddenError when non-owner tries to update another member's expense", async () => {
      const ownerUser = await createUser('owner@test.com');
      const { travel } = await createTravelWithOwner(ownerUser.id);
      const memberUser1 = await createUser('member1@test.com');
      const member1 = await createMember(travel.id, memberUser1.id);
      const memberUser2 = await createUser('member2@test.com');
      const member2 = await createMember(travel.id, memberUser2.id);
      const category = await createCategory(travel.id);

      const expense = await expensesService.create(travel.id, member1.id, {
        categoryId: category.id,
        amount: 50,
        description: 'Member1 expense',
        date: '2026-06-02',
      });

      await expect(
        expensesService.update(expense.id, member2, { description: 'Unauthorized edit' }),
      ).rejects.toThrow(ForbiddenError);
    });

    it('throws BusinessValidationError when updating with invalid categoryId', async () => {
      const owner = await createUser('owner@test.com');
      const { travel, ownerMember } = await createTravelWithOwner(owner.id);
      const category = await createCategory(travel.id);

      const expense = await expensesService.create(travel.id, ownerMember.id, {
        categoryId: category.id,
        amount: 50,
        description: 'Lunch',
        date: '2026-06-02',
      });

      await expect(
        expensesService.update(expense.id, ownerMember, {
          categoryId: '00000000-0000-0000-0000-000000000000',
        }),
      ).rejects.toThrow(BusinessValidationError);
    });
  });

  describe('remove', () => {
    it('allows a member to delete their own expense', async () => {
      const owner = await createUser('owner@test.com');
      const { travel, ownerMember } = await createTravelWithOwner(owner.id);
      const category = await createCategory(travel.id);

      const expense = await expensesService.create(travel.id, ownerMember.id, {
        categoryId: category.id,
        amount: 50,
        description: 'Lunch',
        date: '2026-06-02',
      });

      await expensesService.remove(expense.id, ownerMember);

      const found = await prisma.expense.findUnique({ where: { id: expense.id } });
      expect(found).toBeNull();
    });

    it("allows the owner to delete another member's expense (owner override)", async () => {
      const ownerUser = await createUser('owner@test.com');
      const { travel, ownerMember } = await createTravelWithOwner(ownerUser.id);
      const memberUser = await createUser('member@test.com');
      const member = await createMember(travel.id, memberUser.id);
      const category = await createCategory(travel.id);

      const expense = await expensesService.create(travel.id, member.id, {
        categoryId: category.id,
        amount: 50,
        description: 'Member expense',
        date: '2026-06-02',
      });

      await expensesService.remove(expense.id, ownerMember);

      const found = await prisma.expense.findUnique({ where: { id: expense.id } });
      expect(found).toBeNull();
    });

    it("throws ForbiddenError when non-owner tries to delete another member's expense", async () => {
      const ownerUser = await createUser('owner@test.com');
      const { travel } = await createTravelWithOwner(ownerUser.id);
      const memberUser1 = await createUser('member1@test.com');
      const member1 = await createMember(travel.id, memberUser1.id);
      const memberUser2 = await createUser('member2@test.com');
      const member2 = await createMember(travel.id, memberUser2.id);
      const category = await createCategory(travel.id);

      const expense = await expensesService.create(travel.id, member1.id, {
        categoryId: category.id,
        amount: 50,
        description: 'Member1 expense',
        date: '2026-06-02',
      });

      await expect(expensesService.remove(expense.id, member2)).rejects.toThrow(ForbiddenError);
    });
  });
});
