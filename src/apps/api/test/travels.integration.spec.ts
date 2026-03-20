import { config as loadEnv } from 'dotenv'
import { Test, TestingModule } from '@nestjs/testing'
import { ConfigModule } from '@nestjs/config'
import { validateEnv } from '@/config/env.validation'
import { PrismaModule } from '@/modules/prisma/prisma.module'
import { PrismaService } from '@/modules/prisma/prisma.service'
import { TravelsService } from '@/modules/travels/travels.service'

describe('Travels integration tests', () => {
  let moduleRef: TestingModule
  let prisma: PrismaService
  let travelsService: TravelsService

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
      providers: [TravelsService],
    }).compile()

    await moduleRef.init()
    prisma = moduleRef.get(PrismaService)
    travelsService = moduleRef.get(TravelsService)
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

  describe('createTravel', () => {
    it('creates a travel and auto-creates owner membership', async () => {
      const user = await createUser('owner@test.com')

      const travel = await travelsService.createTravel(user.id, {
        name: 'Trip to Paris',
        currency: 'EUR',
        budget: 5000,
        startDate: '2026-06-01',
        endDate: '2026-06-15',
      })

      expect(travel).toBeDefined()
      expect(travel.name).toBe('Trip to Paris')
      expect(travel.currency).toBe('EUR')
      expect(travel.createdById).toBe(user.id)

      // Verify owner member was created
      const members = await prisma.travelMember.findMany({
        where: { travelId: travel.id },
      })
      expect(members).toHaveLength(1)
      expect(members[0].userId).toBe(user.id)
      expect(members[0].role).toBe('owner')
    })
  })

  describe('findAllByUser', () => {
    it('returns only travels where user is a member', async () => {
      const user1 = await createUser('user1@test.com')
      const user2 = await createUser('user2@test.com')

      // Create travel for user1
      await travelsService.createTravel(user1.id, {
        name: 'User1 Trip',
        currency: 'USD',
        budget: 3000,
        startDate: '2026-06-01',
        endDate: '2026-06-10',
      })

      // Create travel for user2
      await travelsService.createTravel(user2.id, {
        name: 'User2 Trip',
        currency: 'BRL',
        budget: 2000,
        startDate: '2026-07-01',
        endDate: '2026-07-10',
      })

      const user1Travels = await travelsService.findAllByUser(user1.id)
      expect(user1Travels).toHaveLength(1)
      expect(user1Travels[0].name).toBe('User1 Trip')

      const user2Travels = await travelsService.findAllByUser(user2.id)
      expect(user2Travels).toHaveLength(1)
      expect(user2Travels[0].name).toBe('User2 Trip')
    })

    it('orders travels by startDate descending', async () => {
      const user = await createUser('order@test.com')

      await travelsService.createTravel(user.id, {
        name: 'Earlier Trip',
        currency: 'USD',
        budget: 1000,
        startDate: '2026-01-01',
        endDate: '2026-01-10',
      })

      await travelsService.createTravel(user.id, {
        name: 'Later Trip',
        currency: 'USD',
        budget: 2000,
        startDate: '2026-07-01',
        endDate: '2026-07-10',
      })

      const travels = await travelsService.findAllByUser(user.id)
      expect(travels).toHaveLength(2)
      expect(travels[0].name).toBe('Later Trip')
      expect(travels[1].name).toBe('Earlier Trip')
    })
  })

  describe('findOne', () => {
    it('returns travel with members and spending summary', async () => {
      const user = await createUser('detail@test.com')

      const travel = await travelsService.createTravel(user.id, {
        name: 'Detail Trip',
        currency: 'EUR',
        budget: 5000,
        startDate: '2026-06-01',
        endDate: '2026-06-15',
      })

      const result = await travelsService.findOne(travel.id)

      expect(result.name).toBe('Detail Trip')
      expect(result.members).toHaveLength(1)
      expect(result.members[0].role).toBe('owner')
      expect(result.summary).toEqual({
        totalSpent: 0,
        budget: 5000,
        remaining: 5000,
      })
    })

    it('computes correct spending summary with expenses', async () => {
      const user = await createUser('summary@test.com')

      const travel = await travelsService.createTravel(user.id, {
        name: 'Expense Trip',
        currency: 'USD',
        budget: 3000,
        startDate: '2026-06-01',
        endDate: '2026-06-15',
      })

      const member = await prisma.travelMember.findFirst({
        where: { travelId: travel.id, userId: user.id },
      })

      const category = await prisma.category.create({
        data: {
          travelId: travel.id,
          name: 'Food',
          icon: 'utensils',
          color: '#FF0000',
        },
      })

      await prisma.expense.createMany({
        data: [
          {
            travelId: travel.id,
            categoryId: category.id,
            memberId: member!.id,
            amount: 100.5,
            description: 'Lunch',
            date: new Date('2026-06-02'),
          },
          {
            travelId: travel.id,
            categoryId: category.id,
            memberId: member!.id,
            amount: 250.75,
            description: 'Dinner',
            date: new Date('2026-06-03'),
          },
        ],
      })

      const result = await travelsService.findOne(travel.id)

      expect(result.summary.totalSpent).toBeCloseTo(351.25, 2)
      expect(result.summary.budget).toBe(3000)
      expect(result.summary.remaining).toBeCloseTo(2648.75, 2)
    })

    it('throws NotFoundException for non-existent travel', async () => {
      await expect(
        travelsService.findOne('00000000-0000-0000-0000-000000000000'),
      ).rejects.toThrow('Travel not found')
    })
  })

  describe('update', () => {
    it('updates travel fields', async () => {
      const user = await createUser('update@test.com')

      const travel = await travelsService.createTravel(user.id, {
        name: 'Original',
        currency: 'USD',
        budget: 1000,
        startDate: '2026-06-01',
        endDate: '2026-06-10',
      })

      const updated = await travelsService.update(travel.id, {
        name: 'Updated',
        budget: 2000,
      })

      expect(updated.name).toBe('Updated')
      expect(Number(updated.budget)).toBe(2000)
    })
  })

  describe('remove', () => {
    it('deletes travel and cascades to members, categories, and expenses', async () => {
      const user = await createUser('delete@test.com')

      const travel = await travelsService.createTravel(user.id, {
        name: 'Delete Me',
        currency: 'EUR',
        budget: 1000,
        startDate: '2026-06-01',
        endDate: '2026-06-10',
      })

      const member = await prisma.travelMember.findFirst({
        where: { travelId: travel.id },
      })

      const category = await prisma.category.create({
        data: {
          travelId: travel.id,
          name: 'Transport',
          icon: 'car',
          color: '#0000FF',
        },
      })

      await prisma.expense.create({
        data: {
          travelId: travel.id,
          categoryId: category.id,
          memberId: member!.id,
          amount: 50,
          description: 'Bus',
          date: new Date('2026-06-02'),
        },
      })

      await travelsService.remove(travel.id)

      // Verify cascade
      const remainingTravel = await prisma.travel.findUnique({
        where: { id: travel.id },
      })
      expect(remainingTravel).toBeNull()

      const remainingMembers = await prisma.travelMember.findMany({
        where: { travelId: travel.id },
      })
      expect(remainingMembers).toHaveLength(0)

      const remainingCategories = await prisma.category.findMany({
        where: { travelId: travel.id },
      })
      expect(remainingCategories).toHaveLength(0)

      const remainingExpenses = await prisma.expense.findMany({
        where: { travelId: travel.id },
      })
      expect(remainingExpenses).toHaveLength(0)
    })
  })
})
