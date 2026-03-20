import { HttpStatus } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { ConfigModule } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import request from 'supertest'
import type { INestApplication } from '@nestjs/common'
import { CommonAuthModule } from '@/modules/common/auth'
import { PrismaService } from '@/modules/prisma/prisma.service'
import { DashboardController } from './dashboard.controller'
import { DashboardService } from './dashboard.service'
import type { DashboardResponse } from './dashboard.types'

const TEST_JWT_SECRET = 'unit-test-jwt-secret-min-32-characters!!'

const mockGetDashboard = jest.fn()

const dashboardServiceMock = {
  getDashboard: mockGetDashboard,
}

const mockTravelMemberFindFirst = jest.fn()

const prismaServiceMock = {
  travelMember: {
    findFirst: mockTravelMemberFindFirst,
  },
}

describe('DashboardController', () => {
  let app: INestApplication
  let jwtService: JwtService

  beforeEach(async () => {
    jest.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
              JWT_SECRET: TEST_JWT_SECRET,
              JWT_EXPIRES_IN: '30d',
              RESEND_API_KEY: 're_test_placeholder',
              PORT: '3000',
            }),
          ],
        }),
        CommonAuthModule,
      ],
      controllers: [DashboardController],
      providers: [
        { provide: DashboardService, useValue: dashboardServiceMock },
        { provide: PrismaService, useValue: prismaServiceMock },
      ],
    }).compile()

    app = module.createNestApplication()
    await app.init()
    jwtService = module.get(JwtService)
  })

  afterEach(async () => {
    await app.close()
  })

  function signToken(userId: string, email: string) {
    return jwtService.sign({ sub: userId, email })
  }

  function mockMember(role: 'owner' | 'member' = 'member') {
    mockTravelMemberFindFirst.mockResolvedValue({
      id: 'member-1',
      travelId: 'travel-1',
      userId: 'user-1',
      role,
    })
  }

  const dashboardResponse: DashboardResponse = {
    currency: 'EUR',
    overall: { budget: 5000, totalSpent: 500, status: 'ok' },
    memberSpending: [
      { memberId: 'member-1', displayName: 'Alice', totalSpent: 500 },
    ],
    categorySpending: [
      {
        categoryId: 'cat-1',
        name: 'Food',
        icon: '🍔',
        color: '#FF0000',
        totalSpent: 500,
        budgetLimit: 1000,
        status: 'ok',
      },
    ],
  }

  describe('GET /travels/:travelId/dashboard', () => {
    it('returns 401 without auth', async () => {
      await request(app.getHttpServer())
        .get('/travels/travel-1/dashboard')
        .expect(HttpStatus.UNAUTHORIZED)
    })

    it('returns 403 when user is not a travel member', async () => {
      mockTravelMemberFindFirst.mockResolvedValue(null)
      const token = signToken('user-1', 'user@test.com')

      await request(app.getHttpServer())
        .get('/travels/travel-1/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.FORBIDDEN)
    })

    it('calls service with correct travelId parameter', async () => {
      mockMember()
      mockGetDashboard.mockResolvedValue(dashboardResponse)
      const token = signToken('user-1', 'user@test.com')

      await request(app.getHttpServer())
        .get('/travels/travel-1/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK)

      expect(mockGetDashboard).toHaveBeenCalledWith('travel-1')
    })

    it('returns service result as response body', async () => {
      mockMember()
      mockGetDashboard.mockResolvedValue(dashboardResponse)
      const token = signToken('user-1', 'user@test.com')

      const res = await request(app.getHttpServer())
        .get('/travels/travel-1/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK)

      expect(res.body).toEqual(dashboardResponse)
    })
  })
})
