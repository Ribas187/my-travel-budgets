import { HttpStatus } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import type { INestApplication } from '@nestjs/common';

import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';

import { CommonAuthModule } from '@/modules/common/auth';
import { PrismaModule } from '@/modules/prisma/prisma.module';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { BusinessValidationError } from '@/modules/common/exceptions';
import { AllExceptionsFilter } from '@/modules/common/filters';

const TEST_JWT_SECRET = 'unit-test-jwt-secret-min-32-characters!!';

const mockCompleteOnboarding = jest.fn();
const mockResetOnboarding = jest.fn();
const mockDismissTip = jest.fn();
const mockResetTips = jest.fn();

const onboardingServiceMock = {
  completeOnboarding: mockCompleteOnboarding,
  resetOnboarding: mockResetOnboarding,
  dismissTip: mockDismissTip,
  resetTips: mockResetTips,
};

describe('OnboardingController', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  beforeEach(async () => {
    jest.clearAllMocks();

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
              CLOUDINARY_URL: 'cloudinary://key:secret@cloud',
              CORS_ORIGIN: 'http://localhost:5173',
              PORT: '3000',
            }),
          ],
        }),
        PrismaModule,
        CommonAuthModule,
      ],
      controllers: [OnboardingController],
      providers: [
        {
          provide: OnboardingService,
          useValue: onboardingServiceMock,
        },
      ],
    })
      .overrideProvider(PrismaService)
      .useValue({
        user: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'user-1',
            email: 'user@test.com',
            name: 'Test User',
          }),
        },
      })
      .compile();

    app = module.createNestApplication();
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
    jwtService = module.get(JwtService);
  });

  afterEach(async () => {
    await app.close();
  });

  const authToken = () => jwtService.sign({ sub: 'user-1', email: 'user@test.com' });

  describe('PATCH /onboarding/complete', () => {
    it('returns 401 without auth', async () => {
      await request(app.getHttpServer())
        .patch('/onboarding/complete')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('returns 204 when authenticated', async () => {
      mockCompleteOnboarding.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .patch('/onboarding/complete')
        .set('Authorization', `Bearer ${authToken()}`)
        .expect(HttpStatus.NO_CONTENT);

      expect(mockCompleteOnboarding).toHaveBeenCalledWith('user-1');
    });
  });

  describe('PATCH /onboarding/reset', () => {
    it('returns 401 without auth', async () => {
      await request(app.getHttpServer())
        .patch('/onboarding/reset')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('returns 204 when authenticated', async () => {
      mockResetOnboarding.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .patch('/onboarding/reset')
        .set('Authorization', `Bearer ${authToken()}`)
        .expect(HttpStatus.NO_CONTENT);

      expect(mockResetOnboarding).toHaveBeenCalledWith('user-1');
    });
  });

  describe('PATCH /onboarding/tips/:tipId/dismiss', () => {
    it('returns 401 without auth', async () => {
      await request(app.getHttpServer())
        .patch('/onboarding/tips/dashboard_first_visit/dismiss')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('returns 204 for a valid tip ID', async () => {
      mockDismissTip.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .patch('/onboarding/tips/dashboard_first_visit/dismiss')
        .set('Authorization', `Bearer ${authToken()}`)
        .expect(HttpStatus.NO_CONTENT);

      expect(mockDismissTip).toHaveBeenCalledWith('user-1', 'dashboard_first_visit');
    });

    it('returns 400 for an invalid tip ID', async () => {
      mockDismissTip.mockRejectedValue(new BusinessValidationError('Invalid tip ID: invalid_tip'));

      await request(app.getHttpServer())
        .patch('/onboarding/tips/invalid_tip/dismiss')
        .set('Authorization', `Bearer ${authToken()}`)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('PATCH /onboarding/tips/reset', () => {
    it('returns 401 without auth', async () => {
      await request(app.getHttpServer())
        .patch('/onboarding/tips/reset')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('returns 204 when authenticated', async () => {
      mockResetTips.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .patch('/onboarding/tips/reset')
        .set('Authorization', `Bearer ${authToken()}`)
        .expect(HttpStatus.NO_CONTENT);

      expect(mockResetTips).toHaveBeenCalledWith('user-1');
    });
  });
});
