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
          useValue: { sendMagicLink: mockSendMagicLink },
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
