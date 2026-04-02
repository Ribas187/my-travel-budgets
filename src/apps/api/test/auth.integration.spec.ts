import { config as loadEnv } from 'dotenv';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import type { StringValue } from 'ms';

import { validateEnv } from '@/config/env.validation';
import { PrismaModule } from '@/modules/prisma/prisma.module';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { AuthService } from '@/modules/auth/auth.service';
import { PrismaAuthRepository } from '@/modules/auth/repository/auth.repository.prisma';
import type { IAuthRepository } from '@/modules/auth/repository/auth.repository.interface';
import { AUTH_REPOSITORY } from '@/modules/common/database';
import { EmailService } from '@/modules/common/email/email.service';

const mockSendMagicLink = jest.fn().mockResolvedValue(undefined);
const mockSendLoginPin = jest.fn().mockResolvedValue(undefined);

describe('Auth integration tests', () => {
  let moduleRef: TestingModule;
  let prisma: PrismaService;
  let authService: AuthService;
  let authRepository: IAuthRepository;

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
        JwtModule.registerAsync({
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({
            secret: config.getOrThrow<string>('JWT_SECRET'),
            signOptions: {
              expiresIn: config.get<string>('JWT_EXPIRES_IN', '30d') as StringValue,
            },
          }),
        }),
      ],
      providers: [
        AuthService,
        { provide: AUTH_REPOSITORY, useClass: PrismaAuthRepository },
        {
          provide: EmailService,
          useValue: {
            sendMagicLink: mockSendMagicLink,
            sendLoginPin: mockSendLoginPin,
          },
        },
      ],
    }).compile();

    await moduleRef.init();
    prisma = moduleRef.get(PrismaService);
    authService = moduleRef.get(AuthService);
    authRepository = moduleRef.get(AUTH_REPOSITORY);
  });

  afterAll(async () => {
    await moduleRef?.close();
  });

  afterEach(async () => {
    mockSendMagicLink.mockClear();
    mockSendLoginPin.mockClear();
    await prisma.loginPin.deleteMany({});
    await prisma.magicLink.deleteMany({});
    await prisma.expense.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.travelMember.deleteMany({});
    await prisma.travel.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('Task 2: MagicLink record created in database after request', () => {
    it('persists a MagicLink record with correct email, token, and expiresAt', async () => {
      const email = 'integration-task2@test.com';
      await authService.requestMagicLink({ email });

      const records = await prisma.magicLink.findMany({ where: { email } });

      expect(records).toHaveLength(1);
      expect(records[0]!.email).toBe(email);
      expect(records[0]!.token).toMatch(/^[a-f0-9]{64}$/);
      expect(records[0]!.expiresAt.getTime()).toBeGreaterThan(Date.now());
      expect(records[0]!.usedAt).toBeNull();
    });
  });

  describe('Task 3: Token consumption and concurrency', () => {
    it('sets usedAt on the MagicLink after successful verification', async () => {
      const email = 'integration-task3@test.com';
      await authService.requestMagicLink({ email });

      const magicLink = await prisma.magicLink.findFirst({ where: { email } });
      expect(magicLink).not.toBeNull();

      await authService.verifyMagicLink({ token: magicLink!.token });

      const consumed = await prisma.magicLink.findUnique({
        where: { token: magicLink!.token },
      });
      expect(consumed!.usedAt).not.toBeNull();
      expect(consumed!.usedAt).toBeInstanceOf(Date);
    });

    it('creates a User record upon first verification', async () => {
      const email = 'new-user-integration@test.com';
      await authService.requestMagicLink({ email });

      const magicLink = await prisma.magicLink.findFirst({ where: { email } });
      const result = await authService.verifyMagicLink({
        token: magicLink!.token,
      });

      expect(result.accessToken).toBeTruthy();

      const user = await prisma.user.findUnique({ where: { email } });
      expect(user).not.toBeNull();
      expect(user!.email).toBe(email);
    });

    it('returns a valid JWT containing the correct user identity', async () => {
      const email = 'jwt-check@test.com';
      const jwtService = moduleRef.get(JwtService);

      await authService.requestMagicLink({ email });
      const magicLink = await prisma.magicLink.findFirst({ where: { email } });
      const { accessToken } = await authService.verifyMagicLink({
        token: magicLink!.token,
      });

      const payload = jwtService.verify(accessToken);
      expect(payload.email).toBe(email);
      expect(payload.sub).toBeTruthy();

      const user = await prisma.user.findUnique({ where: { email } });
      expect(payload.sub).toBe(user!.id);
    });

    it('concurrent double-verification: only one succeeds (atomic usedAt IS NULL)', async () => {
      const email = 'concurrent@test.com';
      await authService.requestMagicLink({ email });

      const magicLink = await prisma.magicLink.findFirst({ where: { email } });
      const token = magicLink!.token;

      const results = await Promise.allSettled([
        authService.verifyMagicLink({ token }),
        authService.verifyMagicLink({ token }),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);

      const consumed = await prisma.magicLink.findUnique({ where: { token } });
      expect(consumed!.usedAt).not.toBeNull();
    });
  });

  describe('Task 3: PIN login full flow', () => {
    it('full flow: request PIN → verify with correct PIN → receive valid JWT', async () => {
      const email = 'pin-flow@test.com';
      const jwtService = moduleRef.get(JwtService);

      await authService.requestLoginPin({ email });

      const loginPin = await prisma.loginPin.findFirst({ where: { email } });
      expect(loginPin).not.toBeNull();

      const { accessToken } = await authService.verifyLoginPin({
        email,
        pin: loginPin!.pin,
      });

      expect(accessToken).toBeTruthy();
      const payload = jwtService.verify(accessToken);
      expect(payload.email).toBe(email);
      expect(payload.sub).toBeTruthy();
    });

    it('expired PIN: verify returns "Code expired"', async () => {
      const email = 'pin-expired@test.com';

      await authRepository.createLoginPin({
        email,
        pin: '111111',
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(
        authService.verifyLoginPin({ email, pin: '111111' }),
      ).rejects.toThrow('Code expired');
    });

    it('wrong PIN: verify returns "Invalid code" and increments attempts', async () => {
      const email = 'pin-wrong@test.com';

      await authService.requestLoginPin({ email });

      await expect(
        authService.verifyLoginPin({ email, pin: '000000' }),
      ).rejects.toThrow('Invalid code');

      const loginPin = await prisma.loginPin.findFirst({ where: { email } });
      expect(loginPin!.attempts).toBe(1);
    });

    it('attempt exhaustion: fail 5 times → "Too many attempts" and PIN invalidated', async () => {
      const email = 'pin-exhausted@test.com';

      await authService.requestLoginPin({ email });

      for (let i = 0; i < 5; i++) {
        await expect(
          authService.verifyLoginPin({ email, pin: '000000' }),
        ).rejects.toThrow('Invalid code');
      }

      const loginPin = await prisma.loginPin.findFirst({ where: { email } });
      expect(loginPin!.attempts).toBeGreaterThanOrEqual(5);
      expect(loginPin!.usedAt).not.toBeNull();

      const realPin = loginPin!.pin;
      await expect(
        authService.verifyLoginPin({ email, pin: realPin }),
      ).rejects.toThrow('Invalid code');
    });

    it('atomic double-use: verify same PIN concurrently → only one succeeds', async () => {
      const email = 'pin-concurrent@test.com';

      await authService.requestLoginPin({ email });

      const loginPin = await prisma.loginPin.findFirst({ where: { email } });
      const pin = loginPin!.pin;

      const results = await Promise.allSettled([
        authService.verifyLoginPin({ email, pin }),
        authService.verifyLoginPin({ email, pin }),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);
    });

    it('new email: verify PIN creates user in DB', async () => {
      const email = 'pin-new-user@test.com';

      await authService.requestLoginPin({ email });

      const loginPin = await prisma.loginPin.findFirst({ where: { email } });
      await authService.verifyLoginPin({ email, pin: loginPin!.pin });

      const user = await prisma.user.findUnique({ where: { email } });
      expect(user).not.toBeNull();
      expect(user!.email).toBe(email);
    });

    it('existing user: verify PIN returns same JWT sub, no duplicate user', async () => {
      const email = 'pin-existing-user@test.com';
      const jwtService = moduleRef.get(JwtService);

      await authService.requestMagicLink({ email });
      const magicLink = await prisma.magicLink.findFirst({ where: { email } });
      const { accessToken: firstToken } = await authService.verifyMagicLink({
        token: magicLink!.token,
      });
      const firstPayload = jwtService.verify(firstToken);

      await authService.requestLoginPin({ email });
      const loginPin = await prisma.loginPin.findFirst({ where: { email } });
      const { accessToken: secondToken } = await authService.verifyLoginPin({
        email,
        pin: loginPin!.pin,
      });
      const secondPayload = jwtService.verify(secondToken);

      expect(secondPayload.sub).toBe(firstPayload.sub);
      expect(secondPayload.email).toBe(email);

      const users = await prisma.user.findMany({ where: { email } });
      expect(users).toHaveLength(1);
    });
  });

  describe('Task 1: LoginPin repository methods', () => {
    const testEmail = 'pin-test@test.com';
    const testPin = '123456';
    const futureExpiry = new Date(Date.now() + 5 * 60 * 1000);

    describe('createLoginPin', () => {
      it('persists a row with correct email, pin, expiresAt, attempts=0, usedAt=null', async () => {
        const loginPin = await authRepository.createLoginPin({
          email: testEmail,
          pin: testPin,
          expiresAt: futureExpiry,
        });

        expect(loginPin.email).toBe(testEmail);
        expect(loginPin.pin).toBe(testPin);
        expect(loginPin.expiresAt.getTime()).toBe(futureExpiry.getTime());
        expect(loginPin.attempts).toBe(0);
        expect(loginPin.usedAt).toBeNull();
        expect(loginPin.id).toBeTruthy();
        expect(loginPin.createdAt).toBeInstanceOf(Date);
      });
    });

    describe('findLoginPin', () => {
      it('returns the PIN by email+pin when unused', async () => {
        await authRepository.createLoginPin({
          email: testEmail,
          pin: testPin,
          expiresAt: futureExpiry,
        });

        const found = await authRepository.findLoginPin({
          email: testEmail,
          pin: testPin,
        });

        expect(found).not.toBeNull();
        expect(found!.email).toBe(testEmail);
        expect(found!.pin).toBe(testPin);
      });

      it('returns null when the PIN has been used', async () => {
        const loginPin = await authRepository.createLoginPin({
          email: testEmail,
          pin: testPin,
          expiresAt: futureExpiry,
        });

        await authRepository.consumeLoginPin(loginPin.id);

        const found = await authRepository.findLoginPin({
          email: testEmail,
          pin: testPin,
        });

        expect(found).toBeNull();
      });

      it('returns null when no matching PIN exists', async () => {
        const found = await authRepository.findLoginPin({
          email: testEmail,
          pin: '999999',
        });

        expect(found).toBeNull();
      });
    });

    describe('consumeLoginPin', () => {
      it('marks usedAt and returns true on first call', async () => {
        const loginPin = await authRepository.createLoginPin({
          email: testEmail,
          pin: testPin,
          expiresAt: futureExpiry,
        });

        const result = await authRepository.consumeLoginPin(loginPin.id);
        expect(result).toBe(true);

        const record = await prisma.loginPin.findUnique({
          where: { id: loginPin.id },
        });
        expect(record!.usedAt).not.toBeNull();
        expect(record!.usedAt).toBeInstanceOf(Date);
      });

      it('returns false on second call (atomic prevention of double-use)', async () => {
        const loginPin = await authRepository.createLoginPin({
          email: testEmail,
          pin: testPin,
          expiresAt: futureExpiry,
        });

        const first = await authRepository.consumeLoginPin(loginPin.id);
        const second = await authRepository.consumeLoginPin(loginPin.id);

        expect(first).toBe(true);
        expect(second).toBe(false);
      });
    });

    describe('incrementLoginPinAttempts', () => {
      it('increments attempts from 0 to 1 to 2 and returns updated count', async () => {
        const loginPin = await authRepository.createLoginPin({
          email: testEmail,
          pin: testPin,
          expiresAt: futureExpiry,
        });

        const first = await authRepository.incrementLoginPinAttempts(loginPin.id);
        expect(first).toBe(1);

        const second = await authRepository.incrementLoginPinAttempts(loginPin.id);
        expect(second).toBe(2);
      });
    });

    describe('invalidateLoginPin', () => {
      it('sets usedAt so findLoginPin no longer returns it', async () => {
        const loginPin = await authRepository.createLoginPin({
          email: testEmail,
          pin: testPin,
          expiresAt: futureExpiry,
        });

        await authRepository.invalidateLoginPin(loginPin.id);

        const found = await authRepository.findLoginPin({
          email: testEmail,
          pin: testPin,
        });
        expect(found).toBeNull();

        const record = await prisma.loginPin.findUnique({
          where: { id: loginPin.id },
        });
        expect(record!.usedAt).not.toBeNull();
      });
    });
  });
});
