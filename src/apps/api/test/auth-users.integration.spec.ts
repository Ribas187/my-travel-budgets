import { config as loadEnv } from 'dotenv'
import type { StringValue } from 'ms'
import { Test, TestingModule } from '@nestjs/testing'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { validateEnv } from '@/config/env.validation'
import { PrismaModule } from '@/modules/prisma/prisma.module'
import { PrismaService } from '@/modules/prisma/prisma.service'
import { AuthService } from '@/modules/auth/auth.service'
import { UsersService } from '@/modules/users/users.service'
import { EmailService } from '@/modules/common/email/email.service'

const mockSendMagicLink = jest.fn().mockResolvedValue(undefined)

describe('Auth & Users integration tests', () => {
  let moduleRef: TestingModule
  let prisma: PrismaService
  let authService: AuthService
  let usersService: UsersService

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
        JwtModule.registerAsync({
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({
            secret: config.getOrThrow<string>('JWT_SECRET'),
            signOptions: {
              expiresIn: config.get<string>(
                'JWT_EXPIRES_IN',
                '30d',
              ) as StringValue,
            },
          }),
        }),
      ],
      providers: [
        AuthService,
        UsersService,
        {
          provide: EmailService,
          useValue: { sendMagicLink: mockSendMagicLink },
        },
      ],
    }).compile()

    await moduleRef.init()
    prisma = moduleRef.get(PrismaService)
    authService = moduleRef.get(AuthService)
    usersService = moduleRef.get(UsersService)
  })

  afterAll(async () => {
    await moduleRef?.close()
  })

  afterEach(async () => {
    mockSendMagicLink.mockClear()
    await prisma.magicLink.deleteMany({})
    await prisma.user.deleteMany({})
  })

  describe('MagicLink persistence and retrieval', () => {
    it('persists a MagicLink record with correct email, token, and expiresAt', async () => {
      const email = 'magiclink-crud@test.com'
      await authService.requestMagicLink({ email })

      const records = await prisma.magicLink.findMany({ where: { email } })

      expect(records).toHaveLength(1)
      expect(records[0]!.email).toBe(email)
      expect(records[0]!.token).toMatch(/^[a-f0-9]{64}$/)
      expect(records[0]!.expiresAt.getTime()).toBeGreaterThan(Date.now())
      expect(records[0]!.usedAt).toBeNull()
    })

    it('retrieves MagicLink by token after creation', async () => {
      const email = 'magiclink-retrieve@test.com'
      await authService.requestMagicLink({ email })

      const magicLink = await prisma.magicLink.findFirst({ where: { email } })
      expect(magicLink).not.toBeNull()

      const byToken = await prisma.magicLink.findUnique({
        where: { token: magicLink!.token },
      })
      expect(byToken).toEqual(magicLink)
    })
  })

  describe('Token atomic consumption under concurrency', () => {
    it('only one of two simultaneous verifications succeeds', async () => {
      const email = 'concurrent@test.com'
      await authService.requestMagicLink({ email })

      const magicLink = await prisma.magicLink.findFirst({ where: { email } })
      const token = magicLink!.token

      const results = await Promise.allSettled([
        authService.verifyMagicLink({ token }),
        authService.verifyMagicLink({ token }),
      ])

      const fulfilled = results.filter((r) => r.status === 'fulfilled')
      const rejected = results.filter((r) => r.status === 'rejected')

      expect(fulfilled).toHaveLength(1)
      expect(rejected).toHaveLength(1)

      const consumed = await prisma.magicLink.findUnique({
        where: { token },
      })
      expect(consumed!.usedAt).not.toBeNull()
    })
  })

  describe('End-to-end backend cycle: request → verify → users/me', () => {
    it('request magic link → verify token → fetch profile', async () => {
      const email = 'e2e-cycle@test.com'
      await authService.requestMagicLink({ email })

      const magicLink = await prisma.magicLink.findFirst({ where: { email } })
      const { accessToken } = await authService.verifyMagicLink({
        token: magicLink!.token,
      })

      expect(accessToken).toBeTruthy()

      const user = await prisma.user.findUnique({ where: { email } })
      expect(user).not.toBeNull()

      const profile = await usersService.getMe(user!.id)
      expect(profile.email).toBe(email)
      expect(profile.id).toBe(user!.id)
    })
  })
})
