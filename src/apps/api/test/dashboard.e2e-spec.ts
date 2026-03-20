import { config as loadEnv } from 'dotenv'
import { Test } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import { ConfigModule } from '@nestjs/config'
import { validateEnv } from '@/config/env.validation'
import { PrismaModule } from '@/modules/prisma/prisma.module'
import { PrismaService } from '@/modules/prisma/prisma.service'
import { AuthModule } from '@/modules/auth/auth.module'
import { UsersModule } from '@/modules/users/users.module'
import { TravelsModule } from '@/modules/travels/travels.module'
import { MembersModule } from '@/modules/members/members.module'
import { CategoriesModule } from '@/modules/categories/categories.module'
import { ExpensesModule } from '@/modules/expenses/expenses.module'
import { DashboardModule } from '@/modules/dashboard/dashboard.module'
import { EmailService } from '@/modules/common/email/email.service'

const mockSendMagicLink = jest.fn().mockResolvedValue(undefined)

describe('Dashboard E2E', () => {
  let app: INestApplication
  let prisma: PrismaService

  // ── Shared state ──────────────────────────────────────────────────────────
  let ownerJwt: string
  let memberJwt: string
  let nonMemberJwt: string

  let travelId: string
  let ownerMemberId: string
  let memberMemberId: string
  let guestMemberId: string

  let categoryFoodId: string
  let categoryTransportId: string
  let categoryLodgingId: string

  // Known expense amounts for verification
  const ownerFoodExpense1 = 100
  const ownerFoodExpense2 = 200
  const memberTransportExpense = 50
  const ownerLodgingExpense = 4500 // This will push overall budget to "exceeded"

  const travelBudget = 6000
  const foodBudgetLimit = 1000
  const transportBudgetLimit = 100
  // Lodging has no budget limit

  // ── App bootstrap ─────────────────────────────────────────────────────────
  beforeAll(async () => {
    loadEnv({ path: '.env.local', quiet: true })
    loadEnv({ path: '.env', quiet: true })

    const required: Record<string, string> = {
      DATABASE_URL: process.env.DATABASE_URL ?? '',
      JWT_SECRET: process.env.JWT_SECRET ?? 'e2e-test-secret-min-32-characters!!',
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '30d',
      RESEND_API_KEY: process.env.RESEND_API_KEY ?? 're_e2e_placeholder',
      PORT: process.env.PORT ?? '3000',
    }
    for (const [key, value] of Object.entries(required)) {
      if (!process.env[key]) process.env[key] = value
    }
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL must be set (or present in .env) for E2E tests')
    }

    const moduleFixture = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          validate: validateEnv,
          envFilePath: ['.env.local', '.env'],
        }),
        PrismaModule,
        AuthModule,
        UsersModule,
        TravelsModule,
        MembersModule,
        CategoriesModule,
        ExpensesModule,
        DashboardModule,
      ],
    })
      .overrideProvider(EmailService)
      .useValue({ sendMagicLink: mockSendMagicLink })
      .compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
    await app.init()

    prisma = moduleFixture.get(PrismaService)
  })

  afterAll(async () => {
    await prisma.expense.deleteMany({})
    await prisma.category.deleteMany({})
    await prisma.travelMember.deleteMany({})
    await prisma.travel.deleteMany({})
    await prisma.magicLink.deleteMany({})
    await prisma.user.deleteMany({})
    await app?.close()
  })

  // ── Helper: create a user account and return their JWT ────────────────────
  async function createAuthenticatedUser(email: string): Promise<string> {
    await request(app.getHttpServer())
      .post('/auth/magic-link')
      .send({ email })
      .expect(202)

    const magicLink = await prisma.magicLink.findFirst({ where: { email } })
    const res = await request(app.getHttpServer())
      .get('/auth/verify')
      .query({ token: magicLink!.token })
      .expect(200)

    return res.body.accessToken as string
  }

  // ── Setup: create users, travel, members, categories, expenses ────────────
  describe('0. Setup fixtures', () => {
    it('authenticates users', async () => {
      ownerJwt = await createAuthenticatedUser('dash-owner@test.com')
      memberJwt = await createAuthenticatedUser('dash-member@test.com')
      nonMemberJwt = await createAuthenticatedUser('dash-nonmember@test.com')

      expect(ownerJwt).toBeTruthy()
      expect(memberJwt).toBeTruthy()
      expect(nonMemberJwt).toBeTruthy()
    })

    it('creates travel', async () => {
      const res = await request(app.getHttpServer())
        .post('/travels')
        .set('Authorization', `Bearer ${ownerJwt}`)
        .send({
          name: 'Dashboard Test Trip',
          currency: 'EUR',
          budget: travelBudget,
          startDate: '2026-07-01',
          endDate: '2026-07-31',
        })
        .expect(201)

      travelId = res.body.id as string
      const ownerMember = await prisma.travelMember.findFirst({
        where: { travelId, role: 'owner' },
      })
      ownerMemberId = ownerMember!.id
    })

    it('adds members', async () => {
      const memberRes = await request(app.getHttpServer())
        .post(`/travels/${travelId}/members`)
        .set('Authorization', `Bearer ${ownerJwt}`)
        .send({ email: 'dash-member@test.com' })
        .expect(201)
      memberMemberId = memberRes.body.id as string

      const guestRes = await request(app.getHttpServer())
        .post(`/travels/${travelId}/members`)
        .set('Authorization', `Bearer ${ownerJwt}`)
        .send({ guestName: 'Guest User' })
        .expect(201)
      guestMemberId = guestRes.body.id as string
    })

    it('creates categories', async () => {
      const foodRes = await request(app.getHttpServer())
        .post(`/travels/${travelId}/categories`)
        .set('Authorization', `Bearer ${ownerJwt}`)
        .send({ name: 'Food', icon: 'utensils', color: '#FF5733', budgetLimit: foodBudgetLimit })
        .expect(201)
      categoryFoodId = foodRes.body.id as string

      const transportRes = await request(app.getHttpServer())
        .post(`/travels/${travelId}/categories`)
        .set('Authorization', `Bearer ${ownerJwt}`)
        .send({ name: 'Transport', icon: 'car', color: '#3498DB', budgetLimit: transportBudgetLimit })
        .expect(201)
      categoryTransportId = transportRes.body.id as string

      const lodgingRes = await request(app.getHttpServer())
        .post(`/travels/${travelId}/categories`)
        .set('Authorization', `Bearer ${ownerJwt}`)
        .send({ name: 'Lodging', icon: 'bed', color: '#9B59B6' })
        .expect(201)
      categoryLodgingId = lodgingRes.body.id as string
    })

    it('creates expenses', async () => {
      // Owner: Food expense 1
      await request(app.getHttpServer())
        .post(`/travels/${travelId}/expenses`)
        .set('Authorization', `Bearer ${ownerJwt}`)
        .send({ categoryId: categoryFoodId, amount: ownerFoodExpense1, description: 'Dinner', date: '2026-07-05' })
        .expect(201)

      // Owner: Food expense 2
      await request(app.getHttpServer())
        .post(`/travels/${travelId}/expenses`)
        .set('Authorization', `Bearer ${ownerJwt}`)
        .send({ categoryId: categoryFoodId, amount: ownerFoodExpense2, description: 'Lunch', date: '2026-07-06' })
        .expect(201)

      // Member: Transport expense
      await request(app.getHttpServer())
        .post(`/travels/${travelId}/expenses`)
        .set('Authorization', `Bearer ${memberJwt}`)
        .send({ categoryId: categoryTransportId, amount: memberTransportExpense, description: 'Taxi', date: '2026-07-07' })
        .expect(201)

      // Owner: Lodging expense (large, to push overall status)
      await request(app.getHttpServer())
        .post(`/travels/${travelId}/expenses`)
        .set('Authorization', `Bearer ${ownerJwt}`)
        .send({ categoryId: categoryLodgingId, amount: ownerLodgingExpense, description: 'Hotel', date: '2026-07-08' })
        .expect(201)
    })
  })

  // ── Auth/Authz tests ──────────────────────────────────────────────────────
  describe('1. Authentication & Authorization', () => {
    it('returns 401 without auth token', async () => {
      await request(app.getHttpServer())
        .get(`/travels/${travelId}/dashboard`)
        .expect(401)
    })

    it('returns 403 for authenticated non-member', async () => {
      await request(app.getHttpServer())
        .get(`/travels/${travelId}/dashboard`)
        .set('Authorization', `Bearer ${nonMemberJwt}`)
        .expect(403)
    })
  })

  // ── Dashboard response tests ──────────────────────────────────────────────
  describe('2. Dashboard response', () => {
    let dashboard: Record<string, unknown>

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .get(`/travels/${travelId}/dashboard`)
        .set('Authorization', `Bearer ${ownerJwt}`)
        .expect(200)

      dashboard = res.body
    })

    it('has correct response structure with all fields and types', () => {
      // Top-level
      expect(dashboard).toHaveProperty('currency')
      expect(dashboard).toHaveProperty('overall')
      expect(dashboard).toHaveProperty('memberSpending')
      expect(dashboard).toHaveProperty('categorySpending')
      expect(typeof dashboard.currency).toBe('string')
      expect(Array.isArray(dashboard.memberSpending)).toBe(true)
      expect(Array.isArray(dashboard.categorySpending)).toBe(true)

      // Overall
      const overall = dashboard.overall as Record<string, unknown>
      expect(typeof overall.budget).toBe('number')
      expect(typeof overall.totalSpent).toBe('number')
      expect(['ok', 'warning', 'exceeded']).toContain(overall.status)

      // Member spending items
      const members = dashboard.memberSpending as Array<Record<string, unknown>>
      for (const m of members) {
        expect(typeof m.memberId).toBe('string')
        expect(typeof m.displayName).toBe('string')
        expect(typeof m.totalSpent).toBe('number')
      }

      // Category spending items
      const categories = dashboard.categorySpending as Array<Record<string, unknown>>
      for (const c of categories) {
        expect(typeof c.categoryId).toBe('string')
        expect(typeof c.name).toBe('string')
        expect(typeof c.icon).toBe('string')
        expect(typeof c.color).toBe('string')
        expect(typeof c.totalSpent).toBe('number')
        expect(['ok', 'warning', 'exceeded']).toContain(c.status)
        // budgetLimit is number or null
        expect(c.budgetLimit === null || typeof c.budgetLimit === 'number').toBe(true)
      }
    })

    it('currency matches the travel currency', () => {
      expect(dashboard.currency).toBe('EUR')
    })

    it('member spending totals match sum of their expenses', () => {
      const members = dashboard.memberSpending as Array<{ memberId: string; totalSpent: number }>

      // All 3 members should be present (owner, member, guest)
      expect(members).toHaveLength(3)

      const ownerSpending = members.find((m) => m.memberId === ownerMemberId)
      const memberSpending = members.find((m) => m.memberId === memberMemberId)
      const guestSpending = members.find((m) => m.memberId === guestMemberId)

      expect(ownerSpending).toBeDefined()
      expect(memberSpending).toBeDefined()
      expect(guestSpending).toBeDefined()

      // Owner: 100 + 200 + 4500 = 4800
      expect(ownerSpending!.totalSpent).toBe(ownerFoodExpense1 + ownerFoodExpense2 + ownerLodgingExpense)
      // Member: 50
      expect(memberSpending!.totalSpent).toBe(memberTransportExpense)
      // Guest: 0 (no expenses)
      expect(guestSpending!.totalSpent).toBe(0)
    })

    it('category spending totals match sum of expenses per category', () => {
      const categories = dashboard.categorySpending as Array<{ categoryId: string; totalSpent: number; budgetLimit: number | null }>

      // All 3 categories should be present
      expect(categories).toHaveLength(3)

      const food = categories.find((c) => c.categoryId === categoryFoodId)
      const transport = categories.find((c) => c.categoryId === categoryTransportId)
      const lodging = categories.find((c) => c.categoryId === categoryLodgingId)

      expect(food).toBeDefined()
      expect(transport).toBeDefined()
      expect(lodging).toBeDefined()

      // Food: 100 + 200 = 300
      expect(food!.totalSpent).toBe(ownerFoodExpense1 + ownerFoodExpense2)
      expect(food!.budgetLimit).toBe(foodBudgetLimit)

      // Transport: 50
      expect(transport!.totalSpent).toBe(memberTransportExpense)
      expect(transport!.budgetLimit).toBe(transportBudgetLimit)

      // Lodging: 4500
      expect(lodging!.totalSpent).toBe(ownerLodgingExpense)
      expect(lodging!.budgetLimit).toBeNull()
    })

    it('overall totalSpent equals sum of all expenses, budget matches travel budget', () => {
      const overall = dashboard.overall as { budget: number; totalSpent: number }
      const expectedTotal = ownerFoodExpense1 + ownerFoodExpense2 + memberTransportExpense + ownerLodgingExpense

      expect(overall.totalSpent).toBe(expectedTotal)
      expect(overall.budget).toBe(travelBudget)
    })

    it('alert statuses are correct based on spending vs limits', () => {
      const overall = dashboard.overall as { status: string }
      const categories = dashboard.categorySpending as Array<{ categoryId: string; status: string }>

      // Food: 300 / 1000 = 30% → ok
      const food = categories.find((c) => c.categoryId === categoryFoodId)
      expect(food!.status).toBe('ok')

      // Transport: 50 / 100 = 50% → ok (< 80%)
      const transport = categories.find((c) => c.categoryId === categoryTransportId)
      expect(transport!.status).toBe('ok')

      // Lodging: no budget limit → ok
      const lodging = categories.find((c) => c.categoryId === categoryLodgingId)
      expect(lodging!.status).toBe('ok')

      // Overall: 4850 / 6000 = 80.83% → warning
      expect(overall.status).toBe('warning')
    })

    it('member can also access the dashboard', async () => {
      const res = await request(app.getHttpServer())
        .get(`/travels/${travelId}/dashboard`)
        .set('Authorization', `Bearer ${memberJwt}`)
        .expect(200)

      expect(res.body.currency).toBe('EUR')
      expect(res.body.overall).toBeDefined()
    })
  })
})
