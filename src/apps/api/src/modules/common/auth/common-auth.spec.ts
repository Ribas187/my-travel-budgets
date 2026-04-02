import type { INestApplication } from '@nestjs/common';
import { Controller, Get, HttpStatus, UseGuards } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, type TestingModule } from '@nestjs/testing';
import jwt from 'jsonwebtoken';
import request from 'supertest';

import {
  CheckPolicy,
  CommonAuthModule,
  CurrentUser,
  IsAuthenticatedPolicy,
  JwtAuthGuard,
  PolicyGuard,
  type JwtAuthUser,
} from '@/modules/common/auth';

const TEST_JWT_SECRET = 'unit-test-jwt-secret-min-32-characters!!';

const testEnv = {
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  JWT_SECRET: TEST_JWT_SECRET,
  JWT_EXPIRES_IN: '30d',
  RESEND_API_KEY: 're_test_unit_placeholder_key_xxxx',
  CLOUDINARY_URL: 'cloudinary://key:secret@cloud',
  CORS_ORIGIN: 'http://localhost:5173',
  PORT: '3000',
};

@Controller('test-auth')
class TestAuthController {
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: JwtAuthUser) {
    return user;
  }

  @Get('policy-protected')
  @UseGuards(JwtAuthGuard, PolicyGuard)
  @CheckPolicy(IsAuthenticatedPolicy)
  policyProtected(@CurrentUser() user: JwtAuthUser) {
    return { ok: true, userId: user.userId };
  }
}

describe('JwtAuthGuard & CurrentUser (HTTP)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [() => testEnv],
        }),
        CommonAuthModule,
      ],
      controllers: [TestAuthController],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    jwtService = moduleFixture.get(JwtService);
  });

  afterEach(async () => {
    await app?.close();
  });

  describe('JwtAuthGuard', () => {
    it('rejects requests with no Authorization header', async () => {
      await request(app.getHttpServer()).get('/test-auth/me').expect(HttpStatus.UNAUTHORIZED);
    });

    it('rejects requests with invalid JWT', async () => {
      const badToken = jwt.sign({ sub: 'user-1', email: 'a@test.com' }, 'wrong-secret', {
        expiresIn: '1h',
      });

      await request(app.getHttpServer())
        .get('/test-auth/me')
        .set('Authorization', `Bearer ${badToken}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('rejects requests with expired JWT', async () => {
      const expiredToken = jwt.sign({ sub: 'user-1', email: 'a@test.com' }, TEST_JWT_SECRET, {
        expiresIn: '-60s',
      });

      await request(app.getHttpServer())
        .get('/test-auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('allows requests with valid JWT', async () => {
      const token = jwtService.sign({ sub: 'user-1', email: 'signed@test.com' });

      await request(app.getHttpServer())
        .get('/test-auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK);
    });
  });

  describe('CurrentUser decorator', () => {
    it('extracts user from request object', async () => {
      const token = jwtService.sign({ sub: 'user-42', email: 'me@test.com' });

      const res = await request(app.getHttpServer())
        .get('/test-auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK);

      expect(res.body).toEqual({ userId: 'user-42', email: 'me@test.com' });
    });
  });

  describe('integration: guard on test endpoint with real JWT', () => {
    it('returns 401 without token and 200 with signed JWT', async () => {
      await request(app.getHttpServer()).get('/test-auth/me').expect(HttpStatus.UNAUTHORIZED);

      const token = jwtService.sign({ sub: 'int-user', email: 'int@test.com' });

      const res = await request(app.getHttpServer())
        .get('/test-auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK);

      expect(res.body).toEqual({ userId: 'int-user', email: 'int@test.com' });
    });
  });

  describe('PolicyGuard + IsAuthenticatedPolicy integration', () => {
    it('returns 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/test-auth/policy-protected')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('returns 200 when authenticated and policy allows', async () => {
      const token = jwtService.sign({ sub: 'policy-user', email: 'policy@test.com' });

      const res = await request(app.getHttpServer())
        .get('/test-auth/policy-protected')
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK);

      expect(res.body).toEqual({ ok: true, userId: 'policy-user' });
    });
  });
});
