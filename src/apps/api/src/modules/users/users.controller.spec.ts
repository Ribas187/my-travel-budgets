import { HttpStatus, ValidationPipe } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { ConfigModule } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import request from 'supertest'
import type { INestApplication } from '@nestjs/common'
import { CommonAuthModule } from '@/modules/common/auth'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'

const TEST_JWT_SECRET = 'unit-test-jwt-secret-min-32-characters!!'

const mockGetMe = jest.fn()
const mockUpdateMe = jest.fn()

const usersServiceMock = {
  getMe: mockGetMe,
  updateMe: mockUpdateMe,
}

describe('UsersController', () => {
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
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: usersServiceMock,
        },
      ],
    }).compile()

    app = module.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
    await app.init()
    jwtService = module.get(JwtService)
  })

  afterEach(async () => {
    await app.close()
  })

  describe('GET /users/me', () => {
    it('returns 401 without auth', async () => {
      await request(app.getHttpServer()).get('/users/me').expect(HttpStatus.UNAUTHORIZED)
    })

    it('returns 200 with user profile when authenticated', async () => {
      const profile = {
        id: 'user-1',
        email: 'user@test.com',
        name: 'Test User',
        avatarUrl: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      }
      mockGetMe.mockResolvedValue(profile)

      const token = jwtService.sign({ sub: 'user-1', email: 'user@test.com' })

      const res = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK)

      expect(res.body).toMatchObject({
        id: 'user-1',
        email: 'user@test.com',
        name: 'Test User',
        avatarUrl: null,
      })
    })
  })

  describe('PATCH /users/me', () => {
    it('returns 401 without auth', async () => {
      await request(app.getHttpServer())
        .patch('/users/me')
        .send({ name: 'New Name' })
        .expect(HttpStatus.UNAUTHORIZED)
    })

    it('returns 200 with updated profile when authenticated', async () => {
      const updated = {
        id: 'user-1',
        email: 'user@test.com',
        name: 'New Name',
        avatarUrl: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
      }
      mockUpdateMe.mockResolvedValue(updated)

      const token = jwtService.sign({ sub: 'user-1', email: 'user@test.com' })

      const res = await request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'New Name' })
        .expect(HttpStatus.OK)

      expect(res.body).toMatchObject({
        id: 'user-1',
        email: 'user@test.com',
        name: 'New Name',
      })
    })
  })
})
