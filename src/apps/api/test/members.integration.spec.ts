import { config as loadEnv } from 'dotenv'
import { Test, TestingModule } from '@nestjs/testing'
import { ConfigModule } from '@nestjs/config'
import { validateEnv } from '@/config/env.validation'
import { PrismaModule } from '@/modules/prisma/prisma.module'
import { PrismaService } from '@/modules/prisma/prisma.service'
import { MembersService } from '@/modules/members/members.service'

describe('Members integration tests', () => {
  let moduleRef: TestingModule
  let prisma: PrismaService
  let membersService: MembersService

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
      providers: [MembersService],
    }).compile()

    await moduleRef.init()
    prisma = moduleRef.get(PrismaService)
    membersService = moduleRef.get(MembersService)
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
      data: {
        travelId: travel.id,
        userId,
        role: 'owner',
      },
    })

    return travel
  }

  describe('addMember', () => {
    it('adds a registered user by email', async () => {
      const owner = await createUser('owner@test.com')
      const memberUser = await createUser('member@test.com')
      const travel = await createTravelWithOwner(owner.id)

      const member = await membersService.addMember(travel.id, {
        email: 'member@test.com',
      })

      expect(member).toBeDefined()
      expect(member.travelId).toBe(travel.id)
      expect(member.userId).toBe(memberUser.id)
      expect(member.role).toBe('member')
    })

    it('throws NotFoundException for unregistered email', async () => {
      const owner = await createUser('owner@test.com')
      const travel = await createTravelWithOwner(owner.id)

      await expect(
        membersService.addMember(travel.id, { email: 'unknown@test.com' }),
      ).rejects.toThrow('User not found. You can add them as a named guest instead.')
    })

    it('adds a guest member', async () => {
      const owner = await createUser('owner@test.com')
      const travel = await createTravelWithOwner(owner.id)

      const member = await membersService.addMember(travel.id, {
        guestName: 'John Doe',
      })

      expect(member).toBeDefined()
      expect(member.travelId).toBe(travel.id)
      expect(member.userId).toBeNull()
      expect(member.guestName).toBe('John Doe')
      expect(member.role).toBe('member')
    })

    it('throws ConflictException when adding duplicate member', async () => {
      const owner = await createUser('owner@test.com')
      await createUser('member@test.com')
      const travel = await createTravelWithOwner(owner.id)

      await membersService.addMember(travel.id, { email: 'member@test.com' })

      await expect(
        membersService.addMember(travel.id, { email: 'member@test.com' }),
      ).rejects.toThrow('User is already a member of this travel')
    })
  })

  describe('removeMember', () => {
    it('removes a member successfully', async () => {
      const owner = await createUser('owner@test.com')
      await createUser('member@test.com')
      const travel = await createTravelWithOwner(owner.id)

      const member = await membersService.addMember(travel.id, {
        email: 'member@test.com',
      })

      await membersService.removeMember(travel.id, member.id)

      const remaining = await prisma.travelMember.findMany({
        where: { travelId: travel.id },
      })
      // Only the owner should remain
      expect(remaining).toHaveLength(1)
      expect(remaining[0].role).toBe('owner')
    })

    it('throws BadRequestException when removing the owner', async () => {
      const owner = await createUser('owner@test.com')
      const travel = await createTravelWithOwner(owner.id)

      const ownerMember = await prisma.travelMember.findFirst({
        where: { travelId: travel.id, userId: owner.id },
      })

      await expect(
        membersService.removeMember(travel.id, ownerMember!.id),
      ).rejects.toThrow('Cannot remove the travel owner')
    })

    it('throws NotFoundException for non-existent member', async () => {
      const owner = await createUser('owner@test.com')
      const travel = await createTravelWithOwner(owner.id)

      await expect(
        membersService.removeMember(travel.id, '00000000-0000-0000-0000-000000000000'),
      ).rejects.toThrow('Member not found')
    })

    it('preserves expenses after member removal', async () => {
      const owner = await createUser('owner@test.com')
      await createUser('member@test.com')
      const travel = await createTravelWithOwner(owner.id)

      const member = await membersService.addMember(travel.id, {
        email: 'member@test.com',
      })

      // Create a category and expense for the member
      const category = await prisma.category.create({
        data: {
          travelId: travel.id,
          name: 'Food',
          icon: 'utensils',
          color: '#FF0000',
        },
      })

      await prisma.expense.create({
        data: {
          travelId: travel.id,
          categoryId: category.id,
          memberId: member.id,
          amount: 50,
          description: 'Lunch',
          date: new Date('2026-06-02'),
        },
      })

      // Remove the member
      await membersService.removeMember(travel.id, member.id)

      // Verify expenses are preserved (memberId set to null by onDelete: SetNull)
      const expenses = await prisma.expense.findMany({
        where: { travelId: travel.id },
      })
      expect(expenses).toHaveLength(1)
      expect(expenses[0].memberId).toBeNull()
    })
  })
})
