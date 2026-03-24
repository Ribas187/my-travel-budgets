import { HttpStatus, ValidationPipe } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import type { INestApplication } from '@nestjs/common';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';

import { CommonAuthModule } from '@/modules/common/auth';
import { PrismaModule } from '@/modules/prisma/prisma.module';
import { PrismaService } from '@/modules/prisma/prisma.service';

const TEST_JWT_SECRET = 'unit-test-jwt-secret-min-32-characters!!';

const mockGetMe = jest.fn();
const mockUpdateMe = jest.fn();
const mockSetMainTravel = jest.fn();

const usersServiceMock = {
  getMe: mockGetMe,
  updateMe: mockUpdateMe,
  setMainTravel: mockSetMainTravel,
};

describe('UsersController', () => {
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
              PORT: '3000',
            }),
          ],
        }),
        PrismaModule,
        CommonAuthModule,
      ],
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: usersServiceMock,
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
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
    jwtService = module.get(JwtService);
  });

  afterEach(async () => {
    await app.close();
  });

  const authToken = () => jwtService.sign({ sub: 'user-1', email: 'user@test.com' });

  const baseProfile = {
    id: 'user-1',
    email: 'user@test.com',
    name: 'Test User',
    avatarUrl: null,
    mainTravelId: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
  };

  describe('GET /users/me', () => {
    it('returns 401 without auth', async () => {
      await request(app.getHttpServer()).get('/users/me').expect(HttpStatus.UNAUTHORIZED);
    });

    it('returns 200 with user profile including mainTravelId when authenticated', async () => {
      mockGetMe.mockResolvedValue(baseProfile);

      const res = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${authToken()}`)
        .expect(HttpStatus.OK);

      expect(res.body).toMatchObject({
        id: 'user-1',
        email: 'user@test.com',
        name: 'Test User',
        avatarUrl: null,
        mainTravelId: null,
      });
    });
  });

  describe('PATCH /users/me', () => {
    it('returns 401 without auth', async () => {
      await request(app.getHttpServer())
        .patch('/users/me')
        .send({ name: 'New Name' })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('returns 200 with updated profile when authenticated', async () => {
      const updated = { ...baseProfile, name: 'New Name', updatedAt: new Date() };
      mockUpdateMe.mockResolvedValue(updated);

      const res = await request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${authToken()}`)
        .send({ name: 'New Name' })
        .expect(HttpStatus.OK);

      expect(res.body).toMatchObject({
        id: 'user-1',
        email: 'user@test.com',
        name: 'New Name',
      });
    });
  });

  describe('PATCH /users/me/main-travel', () => {
    it('returns 401 without auth', async () => {
      await request(app.getHttpServer())
        .patch('/users/me/main-travel')
        .send({ travelId: 'travel-1' })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('returns 200 when setting mainTravelId', async () => {
      const updated = { ...baseProfile, mainTravelId: 'travel-1' };
      mockSetMainTravel.mockResolvedValue(updated);

      const res = await request(app.getHttpServer())
        .patch('/users/me/main-travel')
        .set('Authorization', `Bearer ${authToken()}`)
        .send({ travelId: '550e8400-e29b-41d4-a716-446655440000' })
        .expect(HttpStatus.OK);

      expect(mockSetMainTravel).toHaveBeenCalledWith('user-1', {
        travelId: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(res.body).toMatchObject({ mainTravelId: 'travel-1' });
    });

    it('returns 200 when clearing mainTravelId with null', async () => {
      const updated = { ...baseProfile, mainTravelId: null };
      mockSetMainTravel.mockResolvedValue(updated);

      const res = await request(app.getHttpServer())
        .patch('/users/me/main-travel')
        .set('Authorization', `Bearer ${authToken()}`)
        .send({ travelId: null })
        .expect(HttpStatus.OK);

      expect(mockSetMainTravel).toHaveBeenCalledWith('user-1', { travelId: null });
      expect(res.body).toMatchObject({ mainTravelId: null });
    });

    it('returns 400 when travelId is not a valid UUID', async () => {
      await request(app.getHttpServer())
        .patch('/users/me/main-travel')
        .set('Authorization', `Bearer ${authToken()}`)
        .send({ travelId: 'not-a-uuid' })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });
});
