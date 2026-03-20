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
import { EmailService } from '@/modules/common/email/email.service'

const mockSendMagicLink = jest.fn().mockResolvedValue(undefined)

describe('Auth & Users E2E', () => {
  let app: INestApplication
  let prisma: PrismaService

  beforeAll(async () => {
    loadEnv({ path: '.env.local', quiet: true })
    loadEnv({ path: '.env', quiet: true })

    const required: Record<string, string> = {
      DATABASE_URL: process.env.DATABASE_URL ?? '',
      JWT_SECRET:
        process.env.JWT_SECRET ?? 'e2e-test-secret-min-32-characters!!',
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '30d',
      RESEND_API_KEY:
        process.env.RESEND_API_KEY ?? 're_e2e_placeholder',
      PORT: process.env.PORT ?? '3000',
    }
    for (const [key, value] of Object.entries(required)) {
      if (!process.env[key]) process.env[key] = value
    }
    if (!process.env.DATABASE_URL) {
      throw new Error(
        'DATABASE_URL must be set (or present in .env) for E2E tests',
      )
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
      ],
    })
      .overrideProvider(EmailService)
      .useValue({ sendMagicLink: mockSendMagicLink })
      .compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
    await app.init()

    prisma = moduleFixture.get(PrismaService)
  })

  afterAll(async () => {
    await app?.close()
  })

  afterEach(async () => {
    mockSendMagicLink.mockClear()
    await prisma.magicLink.deleteMany({})
    await prisma.user.deleteMany({})
  })

  // --- Helper: create a magic link and return the token ---
  async function createMagicLinkToken(email: string): Promise<string> {
    await request(app.getHttpServer())
      .post('/auth/magic-link')
      .send({ email })
      .expect(202)

    const magicLink = await prisma.magicLink.findFirst({ where: { email } })
    return magicLink!.token
  }

  // --- Helper: verify a token and return the JWT ---
  async function verifyAndGetJwt(email: string): Promise<string> {
    const token = await createMagicLinkToken(email)
    const res = await request(app.getHttpServer())
      .get('/auth/verify')
      .query({ token })
      .expect(200)
    return res.body.accessToken
  }

  // =========================================================
  // POST /auth/magic-link
  // =========================================================
  describe('POST /auth/magic-link', () => {
    it('returns 202 for a valid email', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/magic-link')
        .send({ email: 'valid@example.com' })
        .expect(202)

      expect(res.body).toEqual({
        message: expect.any(String),
      })
      expect(mockSendMagicLink).toHaveBeenCalledWith(
        'valid@example.com',
        expect.any(String),
      )
    })

    it('returns 400 for an invalid email', async () => {
      await request(app.getHttpServer())
        .post('/auth/magic-link')
        .send({ email: 'not-an-email' })
        .expect(400)
    })

    it('returns 400 when email is missing', async () => {
      await request(app.getHttpServer())
        .post('/auth/magic-link')
        .send({})
        .expect(400)
    })
  })

  // =========================================================
  // GET /auth/verify
  // =========================================================
  describe('GET /auth/verify', () => {
    it('returns 200 with JWT for a valid token', async () => {
      const token = await createMagicLinkToken('verify-valid@test.com')

      const res = await request(app.getHttpServer())
        .get('/auth/verify')
        .query({ token })
        .expect(200)

      expect(res.body).toEqual({
        accessToken: expect.any(String),
        tokenType: 'Bearer',
        expiresIn: expect.any(Number),
      })
    })

    it('returns 401 for an expired token', async () => {
      const token = await createMagicLinkToken('verify-expired@test.com')

      // Manually expire the token
      await prisma.magicLink.updateMany({
        where: { token },
        data: { expiresAt: new Date(Date.now() - 1000) },
      })

      await request(app.getHttpServer())
        .get('/auth/verify')
        .query({ token })
        .expect(401)
    })

    it('returns 401 for an already-used token', async () => {
      const token = await createMagicLinkToken('verify-used@test.com')

      // Use the token first
      await request(app.getHttpServer())
        .get('/auth/verify')
        .query({ token })
        .expect(200)

      // Try to use it again
      await request(app.getHttpServer())
        .get('/auth/verify')
        .query({ token })
        .expect(401)
    })

    it('returns 401 for a non-existent token', async () => {
      await request(app.getHttpServer())
        .get('/auth/verify')
        .query({ token: 'nonexistent-token-value' })
        .expect(401)
    })

    it('returns 400 when token query param is missing', async () => {
      await request(app.getHttpServer())
        .get('/auth/verify')
        .expect(400)
    })
  })

  // =========================================================
  // GET /users/me
  // =========================================================
  describe('GET /users/me', () => {
    it('returns 200 with user profile when authenticated', async () => {
      const jwt = await verifyAndGetJwt('profile@test.com')

      const res = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${jwt}`)
        .expect(200)

      expect(res.body).toEqual({
        id: expect.any(String),
        email: 'profile@test.com',
        name: expect.any(String),
        avatarUrl: null,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      })
    })

    it('returns 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get('/users/me')
        .expect(401)
    })
  })

  // =========================================================
  // PATCH /users/me
  // =========================================================
  describe('PATCH /users/me', () => {
    it('updates name and returns updated profile', async () => {
      const jwt = await verifyAndGetJwt('patch-name@test.com')

      const res = await request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${jwt}`)
        .send({ name: 'New Name' })
        .expect(200)

      expect(res.body.name).toBe('New Name')
      expect(res.body.email).toBe('patch-name@test.com')
    })

    it('updates avatarUrl and returns updated profile', async () => {
      const jwt = await verifyAndGetJwt('patch-avatar@test.com')

      const res = await request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${jwt}`)
        .send({ avatarUrl: 'https://example.com/avatar.png' })
        .expect(200)

      expect(res.body.avatarUrl).toBe('https://example.com/avatar.png')
    })

    it('ignores email field in update (email immutability)', async () => {
      const jwt = await verifyAndGetJwt('email-immutable@test.com')

      const res = await request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${jwt}`)
        .send({ name: 'Updated', email: 'hacked@evil.com' })
        .expect(200)

      expect(res.body.email).toBe('email-immutable@test.com')
      expect(res.body.name).toBe('Updated')
    })

    it('returns 401 without authentication', async () => {
      await request(app.getHttpServer())
        .patch('/users/me')
        .send({ name: 'No Auth' })
        .expect(401)
    })
  })

  // =========================================================
  // Full cycle: request → verify → GET /users/me → PATCH → GET
  // =========================================================
  describe('Full cycle: request → verify → profile fetch → update → fetch', () => {
    it('completes the entire auth and profile flow', async () => {
      const email = 'full-cycle@test.com'

      // Step 1: Request magic link
      await request(app.getHttpServer())
        .post('/auth/magic-link')
        .send({ email })
        .expect(202)

      expect(mockSendMagicLink).toHaveBeenCalledWith(email, expect.any(String))

      // Step 2: Verify token
      const magicLink = await prisma.magicLink.findFirst({ where: { email } })
      const verifyRes = await request(app.getHttpServer())
        .get('/auth/verify')
        .query({ token: magicLink!.token })
        .expect(200)

      const { accessToken } = verifyRes.body
      expect(accessToken).toBeTruthy()

      // Step 3: Fetch profile
      const profileRes = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(profileRes.body.email).toBe(email)
      expect(profileRes.body.id).toBeTruthy()

      // Step 4: Update profile
      const updateRes = await request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Traveler', avatarUrl: 'https://example.com/me.jpg' })
        .expect(200)

      expect(updateRes.body.name).toBe('Traveler')
      expect(updateRes.body.avatarUrl).toBe('https://example.com/me.jpg')
      expect(updateRes.body.email).toBe(email)

      // Step 5: Fetch profile again to confirm persistence
      const confirmRes = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(confirmRes.body.name).toBe('Traveler')
      expect(confirmRes.body.avatarUrl).toBe('https://example.com/me.jpg')
      expect(confirmRes.body.email).toBe(email)
    })
  })
})
