import { config as loadEnv } from 'dotenv';
import { Test } from '@nestjs/testing';
import {
  type INestApplication,
  UnprocessableEntityException,
  ValidationPipe,
} from '@nestjs/common';
import request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import type { ExtractedReceipt } from '@repo/core';

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
import { RECEIPT_VISION_PROVIDER } from '@/modules/receipts/vision/receipt-vision.provider';
import type {
  IReceiptVisionProvider,
  ReceiptImageMimeType,
} from '@/modules/receipts/vision/receipt-vision.provider';
import { EmailService } from '@/modules/common/email/email.service';

const mockSendMagicLink = jest.fn().mockResolvedValue(undefined);

/**
 * Simulates the OpenRouter provider's terminal state — when both extraction attempts
 * returned malformed / schema-violating output and the provider gives up.
 */
class MalformedOutputProvider implements IReceiptVisionProvider {
  extract(_image: Buffer, _mimeType: ReceiptImageMimeType): Promise<ExtractedReceipt> {
    return Promise.reject(
      new UnprocessableEntityException('Receipt content could not be extracted.'),
    );
  }
}

describe('Receipts E2E — vision provider failure', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let ownerJwt: string;
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
      .overrideProvider(RECEIPT_VISION_PROVIDER)
      .useClass(MalformedOutputProvider)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = moduleFixture.get(PrismaService);

    // Authenticate owner and create a travel.
    await request(app.getHttpServer())
      .post('/auth/magic-link')
      .send({ email: 'receipts-fail-owner@test.com' })
      .expect(202);
    const magicLink = await prisma.magicLink.findFirst({
      where: { email: 'receipts-fail-owner@test.com' },
    });
    const verify = await request(app.getHttpServer())
      .get('/auth/verify')
      .query({ token: magicLink!.token })
      .expect(200);
    ownerJwt = verify.body.accessToken as string;

    const travelRes = await request(app.getHttpServer())
      .post('/travels')
      .set('Authorization', `Bearer ${ownerJwt}`)
      .send({
        name: 'Receipts Fail Trip',
        currency: 'USD',
        budget: 500,
        startDate: '2026-09-01',
        endDate: '2026-09-30',
      })
      .expect(201);
    travelId = travelRes.body.id as string;
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

  it('returns 422 when the vision provider exhausts its retries on malformed output', async () => {
    const res = await request(app.getHttpServer())
      .post(`/travels/${travelId}/receipts/extract`)
      .set('Authorization', `Bearer ${ownerJwt}`)
      .attach('image', Buffer.from('jpeg-bytes'), {
        filename: 'receipt.jpg',
        contentType: 'image/jpeg',
      })
      .expect(422);

    expect(res.body.message).toMatch(/could not be extracted/i);
  });
});
