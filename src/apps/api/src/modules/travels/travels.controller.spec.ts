import { HttpStatus, ValidationPipe } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import type { INestApplication } from '@nestjs/common';

import { TravelsController } from './travels.controller';
import { TravelsService } from './travels.service';

import { CommonAuthModule } from '@/modules/common/auth';
import { PrismaService } from '@/modules/prisma/prisma.service';

const TEST_JWT_SECRET = 'unit-test-jwt-secret-min-32-characters!!';

const mockCreateTravel = jest.fn();
const mockFindAllByUser = jest.fn();
const mockFindOne = jest.fn();
const mockUpdate = jest.fn();
const mockRemove = jest.fn();

const travelsServiceMock = {
  createTravel: mockCreateTravel,
  findAllByUser: mockFindAllByUser,
  findOne: mockFindOne,
  update: mockUpdate,
  remove: mockRemove,
};

const mockTravelMemberFindFirst = jest.fn();

const prismaServiceMock = {
  travelMember: {
    findFirst: mockTravelMemberFindFirst,
  },
};

describe('TravelsController', () => {
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
        CommonAuthModule,
      ],
      controllers: [TravelsController],
      providers: [
        { provide: TravelsService, useValue: travelsServiceMock },
        { provide: PrismaService, useValue: prismaServiceMock },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
    jwtService = module.get(JwtService);
  });

  afterEach(async () => {
    await app.close();
  });

  function signToken(userId: string, email: string) {
    return jwtService.sign({ sub: userId, email });
  }

  describe('POST /travels', () => {
    it('returns 401 without auth', async () => {
      await request(app.getHttpServer())
        .post('/travels')
        .send({ name: 'Trip' })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('returns 201 with created travel', async () => {
      const travel = {
        id: 'travel-1',
        name: 'Trip to Paris',
        currency: 'EUR',
        budget: 5000,
        startDate: '2026-06-01',
        endDate: '2026-06-15',
      };
      mockCreateTravel.mockResolvedValue(travel);

      const token = signToken('user-1', 'user@test.com');

      const res = await request(app.getHttpServer())
        .post('/travels')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Trip to Paris',
          currency: 'EUR',
          budget: 5000,
          startDate: '2026-06-01',
          endDate: '2026-06-15',
        })
        .expect(HttpStatus.CREATED);

      expect(res.body).toMatchObject({ id: 'travel-1', name: 'Trip to Paris' });
      expect(mockCreateTravel).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({
          name: 'Trip to Paris',
          currency: 'EUR',
        }),
      );
    });

    it('returns 400 for invalid currency', async () => {
      const token = signToken('user-1', 'user@test.com');

      await request(app.getHttpServer())
        .post('/travels')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Trip',
          currency: 'INVALID',
          budget: 1000,
          startDate: '2026-06-01',
          endDate: '2026-06-15',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('returns 400 when startDate > endDate', async () => {
      const token = signToken('user-1', 'user@test.com');

      await request(app.getHttpServer())
        .post('/travels')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Trip',
          currency: 'EUR',
          budget: 1000,
          startDate: '2026-06-15',
          endDate: '2026-06-01',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('GET /travels', () => {
    it('returns 401 without auth', async () => {
      await request(app.getHttpServer()).get('/travels').expect(HttpStatus.UNAUTHORIZED);
    });

    it('returns 200 with user travels', async () => {
      const travels = [{ id: 'travel-1', name: 'Trip' }];
      mockFindAllByUser.mockResolvedValue(travels);

      const token = signToken('user-1', 'user@test.com');

      const res = await request(app.getHttpServer())
        .get('/travels')
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK);

      expect(res.body).toEqual(travels);
      expect(mockFindAllByUser).toHaveBeenCalledWith('user-1');
    });
  });

  describe('GET /travels/:id', () => {
    it('returns 403 when user is not a member', async () => {
      mockTravelMemberFindFirst.mockResolvedValue(null);

      const token = signToken('user-1', 'user@test.com');

      await request(app.getHttpServer())
        .get('/travels/travel-1')
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('returns 200 with travel detail when user is a member', async () => {
      mockTravelMemberFindFirst.mockResolvedValue({
        id: 'member-1',
        travelId: 'travel-1',
        userId: 'user-1',
        role: 'member',
      });
      const travelDetail = {
        id: 'travel-1',
        name: 'Trip',
        summary: { totalSpent: 0, budget: 5000, remaining: 5000 },
      };
      mockFindOne.mockResolvedValue(travelDetail);

      const token = signToken('user-1', 'user@test.com');

      const res = await request(app.getHttpServer())
        .get('/travels/travel-1')
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK);

      expect(res.body).toMatchObject({ id: 'travel-1', name: 'Trip' });
    });
  });

  describe('PATCH /travels/:id', () => {
    it('returns 403 when user is not owner', async () => {
      mockTravelMemberFindFirst.mockResolvedValue({
        id: 'member-1',
        travelId: 'travel-1',
        userId: 'user-1',
        role: 'member',
      });

      const token = signToken('user-1', 'user@test.com');

      await request(app.getHttpServer())
        .patch('/travels/travel-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated' })
        .expect(HttpStatus.FORBIDDEN);
    });

    it('returns 200 when owner updates', async () => {
      mockTravelMemberFindFirst.mockResolvedValue({
        id: 'member-1',
        travelId: 'travel-1',
        userId: 'user-1',
        role: 'owner',
      });
      mockUpdate.mockResolvedValue({ id: 'travel-1', name: 'Updated' });

      const token = signToken('user-1', 'user@test.com');

      const res = await request(app.getHttpServer())
        .patch('/travels/travel-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated' })
        .expect(HttpStatus.OK);

      expect(res.body.name).toBe('Updated');
    });
  });

  describe('DELETE /travels/:id', () => {
    it('returns 403 when user is not owner', async () => {
      mockTravelMemberFindFirst.mockResolvedValue({
        id: 'member-1',
        travelId: 'travel-1',
        userId: 'user-1',
        role: 'member',
      });

      const token = signToken('user-1', 'user@test.com');

      await request(app.getHttpServer())
        .delete('/travels/travel-1')
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('returns 204 when owner deletes', async () => {
      mockTravelMemberFindFirst.mockResolvedValue({
        id: 'member-1',
        travelId: 'travel-1',
        userId: 'user-1',
        role: 'owner',
      });
      mockRemove.mockResolvedValue(undefined);

      const token = signToken('user-1', 'user@test.com');

      await request(app.getHttpServer())
        .delete('/travels/travel-1')
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.NO_CONTENT);
    });
  });
});
