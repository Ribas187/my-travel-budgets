import { config as loadEnv } from 'dotenv'
import { Test, TestingModule } from '@nestjs/testing'
import { ConfigModule } from '@nestjs/config'
import { validateEnv } from '@/config/env.validation'
import { PrismaModule } from '@/modules/prisma/prisma.module'
import { PrismaService } from '@/modules/prisma/prisma.service'
import { CategoriesService } from '@/modules/categories/categories.service'

describe('Categories integration tests', () => {
  let moduleRef: TestingModule
  let prisma: PrismaService
  let categoriesService: CategoriesService

  beforeAll(async () => {
    loadEnv({ path: '.env.local', quiet: true })
    loadEnv({ path: '.env', quiet: true })

    const required: Record<string, string> = {
      DATABASE_URL: process.env.DATABASE_URL ?? '',
      JWT_SECRET:
        process.env.JWT_SECRET ?? 'integration-test-secret-min-32-chars!!',
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '30d',
      RESEND_API_KEY:
        process.env.RESEND_API_KEY ?? 're_integration_placeholder',
      PORT: process.env.PORT ?? '3000',
    }
    for (const [key, value] of Object.entries(required)) {
      if (!process.env[key]) process.env[key] = value
    }
    if (!process.env.DATABASE_URL) {
      throw new Error(
        'DATABASE_URL must be set (or present in .env) for integration tests',
      )
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
      providers: [CategoriesService],
    }).compile()

    await moduleRef.init()
    prisma = moduleRef.get(PrismaService)
    categoriesService = moduleRef.get(CategoriesService)
  })

  afterAll(async () => {
    await moduleRef?.close()
  })

  afterEach(async () => {
    await prisma.expense.deleteMany({})
    await prisma.category.deleteMany({})
    await prisma.travelMember.deleteMany({})
    await prisma.travel.deleteMany({})
    await prisma.user.deleteMany({})
  })

  async function createUser(email: string) {
    return prisma.user.create({
      data: { email, name: email.split('@')[0] },
    })
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
    })

    await prisma.travelMember.create({
      data: { travelId: travel.id, userId, role: 'owner' },
    })

    return travel
  }

  describe('create', () => {
    it('creates a category with valid data', async () => {
      const owner = await createUser('owner@test.com')
      const travel = await createTravelWithOwner(owner.id)

      const category = await categoriesService.create(travel.id, {
        name: 'Food',
        icon: 'utensils',
        color: '#FF0000',
      })

      expect(category).toBeDefined()
      expect(category.travelId).toBe(travel.id)
      expect(category.name).toBe('Food')
      expect(category.icon).toBe('utensils')
      expect(category.color).toBe('#FF0000')
      expect(category.budgetLimit).toBeNull()
    })

    it('creates a category with budgetLimit', async () => {
      const owner = await createUser('owner@test.com')
      const travel = await createTravelWithOwner(owner.id)

      const category = await categoriesService.create(travel.id, {
        name: 'Transport',
        icon: 'car',
        color: '#0000FF',
        budgetLimit: 1000,
      })

      expect(category.budgetLimit?.toString()).toBe('1000')
    })

    it('throws ConflictException for duplicate category name within same travel (409)', async () => {
      const owner = await createUser('owner@test.com')
      const travel = await createTravelWithOwner(owner.id)

      await categoriesService.create(travel.id, {
        name: 'Food',
        icon: 'utensils',
        color: '#FF0000',
      })

      await expect(
        categoriesService.create(travel.id, {
          name: 'Food',
          icon: 'fork',
          color: '#00FF00',
        }),
      ).rejects.toThrow('A category with this name already exists in this travel')
    })

    it('allows same category name in different travels', async () => {
      const owner = await createUser('owner@test.com')
      const travel1 = await createTravelWithOwner(owner.id)

      const owner2 = await createUser('owner2@test.com')
      const travel2 = await createTravelWithOwner(owner2.id)

      await categoriesService.create(travel1.id, {
        name: 'Food',
        icon: 'utensils',
        color: '#FF0000',
      })

      const cat2 = await categoriesService.create(travel2.id, {
        name: 'Food',
        icon: 'utensils',
        color: '#FF0000',
      })

      expect(cat2).toBeDefined()
    })
  })

  describe('update', () => {
    it('updates category name', async () => {
      const owner = await createUser('owner@test.com')
      const travel = await createTravelWithOwner(owner.id)

      const category = await categoriesService.create(travel.id, {
        name: 'Food',
        icon: 'utensils',
        color: '#FF0000',
      })

      const updated = await categoriesService.update(travel.id, category.id, {
        name: 'Dining',
      })

      expect(updated.name).toBe('Dining')
    })

    it('updates category color', async () => {
      const owner = await createUser('owner@test.com')
      const travel = await createTravelWithOwner(owner.id)

      const category = await categoriesService.create(travel.id, {
        name: 'Food',
        icon: 'utensils',
        color: '#FF0000',
      })

      const updated = await categoriesService.update(travel.id, category.id, {
        color: '#00FF00',
      })

      expect(updated.color).toBe('#00FF00')
    })

    it('throws ConflictException when updating to a duplicate name', async () => {
      const owner = await createUser('owner@test.com')
      const travel = await createTravelWithOwner(owner.id)

      await categoriesService.create(travel.id, {
        name: 'Food',
        icon: 'utensils',
        color: '#FF0000',
      })
      const cat2 = await categoriesService.create(travel.id, {
        name: 'Transport',
        icon: 'car',
        color: '#0000FF',
      })

      await expect(
        categoriesService.update(travel.id, cat2.id, { name: 'Food' }),
      ).rejects.toThrow('A category with this name already exists in this travel')
    })

    it('throws NotFoundException for non-existent category', async () => {
      const owner = await createUser('owner@test.com')
      const travel = await createTravelWithOwner(owner.id)

      await expect(
        categoriesService.update(travel.id, '00000000-0000-0000-0000-000000000000', {
          name: 'Dining',
        }),
      ).rejects.toThrow('Category not found')
    })
  })

  describe('remove', () => {
    it('deletes a category with no expenses', async () => {
      const owner = await createUser('owner@test.com')
      const travel = await createTravelWithOwner(owner.id)

      const category = await categoriesService.create(travel.id, {
        name: 'Food',
        icon: 'utensils',
        color: '#FF0000',
      })

      await categoriesService.remove(travel.id, category.id)

      const found = await prisma.category.findFirst({ where: { id: category.id } })
      expect(found).toBeNull()
    })

    it('throws ConflictException when category has expenses (409)', async () => {
      const owner = await createUser('owner@test.com')
      const travel = await createTravelWithOwner(owner.id)
      const ownerMember = await prisma.travelMember.findFirst({
        where: { travelId: travel.id, userId: owner.id },
      })

      const category = await categoriesService.create(travel.id, {
        name: 'Food',
        icon: 'utensils',
        color: '#FF0000',
      })

      await prisma.expense.create({
        data: {
          travelId: travel.id,
          categoryId: category.id,
          memberId: ownerMember!.id,
          amount: 50,
          description: 'Lunch',
          date: new Date('2026-06-02'),
        },
      })

      await expect(
        categoriesService.remove(travel.id, category.id),
      ).rejects.toThrow(
        'Cannot delete this category because it has associated expenses',
      )
    })

    it('deletes category successfully after expenses are removed', async () => {
      const owner = await createUser('owner@test.com')
      const travel = await createTravelWithOwner(owner.id)
      const ownerMember = await prisma.travelMember.findFirst({
        where: { travelId: travel.id, userId: owner.id },
      })

      const category = await categoriesService.create(travel.id, {
        name: 'Food',
        icon: 'utensils',
        color: '#FF0000',
      })

      const expense = await prisma.expense.create({
        data: {
          travelId: travel.id,
          categoryId: category.id,
          memberId: ownerMember!.id,
          amount: 50,
          description: 'Lunch',
          date: new Date('2026-06-02'),
        },
      })

      // Delete the expense first
      await prisma.expense.delete({ where: { id: expense.id } })

      // Now delete the category
      await categoriesService.remove(travel.id, category.id)

      const found = await prisma.category.findFirst({ where: { id: category.id } })
      expect(found).toBeNull()
    })

    it('throws NotFoundException for non-existent category', async () => {
      const owner = await createUser('owner@test.com')
      const travel = await createTravelWithOwner(owner.id)

      await expect(
        categoriesService.remove(travel.id, '00000000-0000-0000-0000-000000000000'),
      ).rejects.toThrow('Category not found')
    })
  })
})
