import { config as loadEnv } from 'dotenv';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { ConfigModule } from '@nestjs/config';

import { validateEnv } from '@/config/env.validation';
import { PrismaModule } from '@/modules/prisma/prisma.module';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { AuthModule } from '@/modules/auth/auth.module';
import { UsersModule } from '@/modules/users/users.module';
import { TravelsModule } from '@/modules/travels/travels.module';
import { MembersModule } from '@/modules/members/members.module';
import { CategoriesModule } from '@/modules/categories/categories.module';
import { ExpensesModule } from '@/modules/expenses/expenses.module';
import { ReceiptsModule } from '@/modules/receipts/receipts.module';
import { EmailService } from '@/modules/common/email/email.service';

const mockSendMagicLink = jest.fn().mockResolvedValue(undefined);

describe('Receipts E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let ownerJwt: string;
  let nonMemberJwt: string;
  let travelId: string;

  beforeAll(async () => {
    loadEnv({ path: '.env.local', quiet: true });
    loadEnv({ path: '.env', quiet: true });

    const required: Record<string, string> = {
      DATABASE_URL: process.env.DATABASE_URL ?? '',
      JWT_SECRET: process.env.JWT_SECRET ?? 'e2e-test-secret-min-32-characters!!',
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '30d',
      RESEND_API_KEY: process.env.RESEND_API_KEY ?? 're_e2e_placeholder',
      PORT: process.env.PORT ?? '3000',
    };
    for (const [key, value] of Object.entries(required)) {
      if (!process.env[key]) process.env[key] = value;
    }
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL must be set (or present in .env) for E2E tests');
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
        ReceiptsModule,
      ],
    })
      .overrideProvider(EmailService)
      .useValue({ sendMagicLink: mockSendMagicLink })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = moduleFixture.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.expense.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.travelMember.deleteMany({});
    await prisma.travel.deleteMany({});
    await prisma.magicLink.deleteMany({});
    await prisma.user.deleteMany({});
    await app?.close();
  });

  async function createAuthenticatedUser(email: string): Promise<string> {
    await request(app.getHttpServer()).post('/auth/magic-link').send({ email }).expect(202);
    const magicLink = await prisma.magicLink.findFirst({ where: { email } });
    const res = await request(app.getHttpServer())
      .get('/auth/verify')
      .query({ token: magicLink!.token })
      .expect(200);
    return res.body.accessToken as string;
  }

  describe('0. Setup', () => {
    it('authenticates owner and non-member', async () => {
      ownerJwt = await createAuthenticatedUser('receipts-owner@test.com');
      nonMemberJwt = await createAuthenticatedUser('receipts-nonmember@test.com');
      expect(ownerJwt).toBeTruthy();
      expect(nonMemberJwt).toBeTruthy();
    });

    it('creates a travel for the owner', async () => {
      const res = await request(app.getHttpServer())
        .post('/travels')
        .set('Authorization', `Bearer ${ownerJwt}`)
        .send({
          name: 'Receipts Trip',
          currency: 'USD',
          budget: 1000,
          startDate: '2026-09-01',
          endDate: '2026-09-30',
        })
        .expect(201);
      travelId = res.body.id as string;
    });
  });

  describe('1. Authentication & authorization', () => {
    it('returns 401 without an auth token', async () => {
      await request(app.getHttpServer())
        .post(`/travels/${travelId}/receipts/extract`)
        .attach('image', Buffer.from('jpeg-bytes'), {
          filename: 'r.jpg',
          contentType: 'image/jpeg',
        })
        .expect(401);
    });

    it('returns 403 when the authenticated user is not a member of the travel', async () => {
      await request(app.getHttpServer())
        .post(`/travels/${travelId}/receipts/extract`)
        .set('Authorization', `Bearer ${nonMemberJwt}`)
        .attach('image', Buffer.from('jpeg-bytes'), {
          filename: 'r.jpg',
          contentType: 'image/jpeg',
        })
        .expect(403);
    });
  });

  describe('2. File validation', () => {
    it('returns 400 when no file is attached', async () => {
      await request(app.getHttpServer())
        .post(`/travels/${travelId}/receipts/extract`)
        .set('Authorization', `Bearer ${ownerJwt}`)
        .expect(400);
    });

    it('returns 400 when the MIME type is not jpeg or png', async () => {
      await request(app.getHttpServer())
        .post(`/travels/${travelId}/receipts/extract`)
        .set('Authorization', `Bearer ${ownerJwt}`)
        .attach('image', Buffer.from('%PDF-1.4 fake pdf'), {
          filename: 'r.pdf',
          contentType: 'application/pdf',
        })
        .expect(400);
    });

    it('returns 400 when the file exceeds 5 MB', async () => {
      const oversized = Buffer.alloc(5 * 1024 * 1024 + 1, 0xff);
      await request(app.getHttpServer())
        .post(`/travels/${travelId}/receipts/extract`)
        .set('Authorization', `Bearer ${ownerJwt}`)
        .attach('image', oversized, { filename: 'big.jpg', contentType: 'image/jpeg' })
        .expect(400);
    });
  });

  describe('3. Happy path', () => {
    it('returns the stub-extracted payload for a valid jpeg from a travel member', async () => {
      const res = await request(app.getHttpServer())
        .post(`/travels/${travelId}/receipts/extract`)
        .set('Authorization', `Bearer ${ownerJwt}`)
        .attach('image', Buffer.from('jpeg-bytes'), {
          filename: 'receipt.jpg',
          contentType: 'image/jpeg',
        })
        .expect(200);

      expect(res.body).toEqual({
        total: 12.34,
        date: '2026-05-05',
        merchant: 'Stub Café',
      });
    });

    it('also accepts png uploads', async () => {
      const res = await request(app.getHttpServer())
        .post(`/travels/${travelId}/receipts/extract`)
        .set('Authorization', `Bearer ${ownerJwt}`)
        .attach('image', Buffer.from('png-bytes'), {
          filename: 'receipt.png',
          contentType: 'image/png',
        })
        .expect(200);

      expect(res.body.merchant).toBe('Stub Café');
    });
  });
});
