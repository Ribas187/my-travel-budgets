import { HttpStatus, UnauthorizedException, ValidationPipe } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import type { INestApplication } from '@nestjs/common';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

const mockRequestMagicLink = jest.fn();
const mockVerifyMagicLink = jest.fn();
const mockRequestLoginPin = jest.fn();
const mockVerifyLoginPin = jest.fn();

describe('AuthController', () => {
  let app: INestApplication;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot({
          throttlers: [{ name: 'auth', ttl: 900_000, limit: 10 }],
        }),
      ],
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            requestMagicLink: mockRequestMagicLink,
            verifyMagicLink: mockVerifyMagicLink,
            requestLoginPin: mockRequestLoginPin,
            verifyLoginPin: mockVerifyLoginPin,
          },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /auth/magic-link', () => {
    it('returns 202 Accepted for a valid email', async () => {
      mockRequestMagicLink.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .post('/auth/magic-link')
        .send({ email: 'user@test.com' })
        .expect(HttpStatus.ACCEPTED);
    });

    it('returns neutral message in body', async () => {
      mockRequestMagicLink.mockResolvedValue(undefined);

      const res = await request(app.getHttpServer())
        .post('/auth/magic-link')
        .send({ email: 'user@test.com' })
        .expect(HttpStatus.ACCEPTED);

      expect(res.body).toEqual({
        message: 'If this email is registered, you will receive a magic link.',
      });
    });

    it('returns 400 Bad Request for an invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/auth/magic-link')
        .send({ email: 'not-an-email' })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('returns 400 Bad Request when email is missing', async () => {
      await request(app.getHttpServer())
        .post('/auth/magic-link')
        .send({})
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('GET /auth/verify', () => {
    it('returns 200 with AuthSessionResponseDto on success', async () => {
      mockVerifyMagicLink.mockResolvedValue({ accessToken: 'test-jwt-token' });

      const res = await request(app.getHttpServer())
        .get('/auth/verify?token=valid-token')
        .expect(HttpStatus.OK);

      expect(res.body).toEqual({
        accessToken: 'test-jwt-token',
        tokenType: 'Bearer',
        expiresIn: 30 * 24 * 60 * 60,
      });
    });

    it('returns 401 Unauthorized on invalid token', async () => {
      mockVerifyMagicLink.mockRejectedValue(new UnauthorizedException('Invalid token'));

      await request(app.getHttpServer())
        .get('/auth/verify?token=bad-token')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('returns 400 Bad Request when token query param is missing', async () => {
      await request(app.getHttpServer()).get('/auth/verify').expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('POST /auth/login-pin', () => {
    it('returns 202 Accepted and calls service with email', async () => {
      mockRequestLoginPin.mockResolvedValue(undefined);

      const res = await request(app.getHttpServer())
        .post('/auth/login-pin')
        .send({ email: 'user@test.com' })
        .expect(HttpStatus.ACCEPTED);

      expect(mockRequestLoginPin).toHaveBeenCalledWith({ email: 'user@test.com' });
      expect(res.body).toEqual({
        message: 'If this email is registered, you will receive a login code.',
      });
    });

    it('returns 400 Bad Request for an invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/auth/login-pin')
        .send({ email: 'not-an-email' })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('returns 400 Bad Request when email is missing', async () => {
      await request(app.getHttpServer())
        .post('/auth/login-pin')
        .send({})
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('POST /auth/verify-pin', () => {
    it('returns 200 with AuthSessionResponseDto on success', async () => {
      mockVerifyLoginPin.mockResolvedValue({ accessToken: 'pin-jwt-token' });

      const res = await request(app.getHttpServer())
        .post('/auth/verify-pin')
        .send({ email: 'user@test.com', pin: '123456' })
        .expect(HttpStatus.OK);

      expect(mockVerifyLoginPin).toHaveBeenCalledWith({
        email: 'user@test.com',
        pin: '123456',
      });
      expect(res.body).toEqual({
        accessToken: 'pin-jwt-token',
        tokenType: 'Bearer',
        expiresIn: 30 * 24 * 60 * 60,
      });
    });

    it('returns 401 Unauthorized on invalid code', async () => {
      mockVerifyLoginPin.mockRejectedValue(new UnauthorizedException('Invalid code'));

      await request(app.getHttpServer())
        .post('/auth/verify-pin')
        .send({ email: 'user@test.com', pin: '000000' })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('returns 400 Bad Request when email is missing', async () => {
      await request(app.getHttpServer())
        .post('/auth/verify-pin')
        .send({ pin: '123456' })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('returns 400 Bad Request when pin is missing', async () => {
      await request(app.getHttpServer())
        .post('/auth/verify-pin')
        .send({ email: 'user@test.com' })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('returns 400 Bad Request when pin contains letters', async () => {
      await request(app.getHttpServer())
        .post('/auth/verify-pin')
        .send({ email: 'user@test.com', pin: '12ab56' })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('returns 400 Bad Request when pin is too short', async () => {
      await request(app.getHttpServer())
        .post('/auth/verify-pin')
        .send({ email: 'user@test.com', pin: '123' })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('returns 400 Bad Request when pin is too long', async () => {
      await request(app.getHttpServer())
        .post('/auth/verify-pin')
        .send({ email: 'user@test.com', pin: '1234567' })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('returns 400 Bad Request for an invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/auth/verify-pin')
        .send({ email: 'not-an-email', pin: '123456' })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });
});
