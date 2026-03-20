import { HttpStatus, ValidationPipe } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import type { INestApplication } from '@nestjs/common';

import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';

import { CommonAuthModule } from '@/modules/common/auth';
import { PrismaService } from '@/modules/prisma/prisma.service';

const TEST_JWT_SECRET = 'unit-test-jwt-secret-min-32-characters!!';

const mockCreate = jest.fn();
const mockFindAll = jest.fn();
const mockUpdate = jest.fn();
const mockRemove = jest.fn();

const expensesServiceMock = {
  create: mockCreate,
  findAll: mockFindAll,
  update: mockUpdate,
  remove: mockRemove,
};

const mockTravelMemberFindFirst = jest.fn();

const prismaServiceMock = {
  travelMember: {
    findFirst: mockTravelMemberFindFirst,
  },
};

describe('ExpensesController', () => {
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
      controllers: [ExpensesController],
      providers: [
        { provide: ExpensesService, useValue: expensesServiceMock },
        { provide: PrismaService, useValue: prismaServiceMock },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    jwtService = module.get(JwtService);
  });

  afterEach(async () => {
    await app.close();
  });

  function signToken(userId: string, email: string) {
    return jwtService.sign({ sub: userId, email });
  }

  function mockMember(role: 'owner' | 'member' = 'member') {
    mockTravelMemberFindFirst.mockResolvedValue({
      id: 'member-1',
      travelId: 'travel-1',
      userId: 'user-1',
      role,
    });
  }

  const validExpenseBody = {
    categoryId: '550e8400-e29b-41d4-a716-446655440000',
    amount: 50,
    description: 'Lunch',
    date: '2026-06-02',
  };

  const paginatedResponse = {
    data: [],
    meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
  };

  describe('POST /travels/:travelId/expenses', () => {
    it('returns 401 without auth', async () => {
      await request(app.getHttpServer())
        .post('/travels/travel-1/expenses')
        .send(validExpenseBody)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('returns 403 when user is not a travel member', async () => {
      mockTravelMemberFindFirst.mockResolvedValue(null);
      const token = signToken('user-1', 'user@test.com');

      await request(app.getHttpServer())
        .post('/travels/travel-1/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send(validExpenseBody)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('returns 400 when required fields are missing', async () => {
      mockMember();
      const token = signToken('user-1', 'user@test.com');

      await request(app.getHttpServer())
        .post('/travels/travel-1/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 50 })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('returns 400 when amount is negative', async () => {
      mockMember();
      const token = signToken('user-1', 'user@test.com');

      await request(app.getHttpServer())
        .post('/travels/travel-1/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...validExpenseBody, amount: -10 })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('returns 201 when member creates an expense', async () => {
      mockMember();
      const created = {
        id: 'exp-1',
        ...validExpenseBody,
        memberId: 'member-1',
        travelId: 'travel-1',
      };
      mockCreate.mockResolvedValue(created);
      const token = signToken('user-1', 'user@test.com');

      const res = await request(app.getHttpServer())
        .post('/travels/travel-1/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send(validExpenseBody)
        .expect(HttpStatus.CREATED);

      expect(res.body).toMatchObject({ id: 'exp-1' });
      expect(mockCreate).toHaveBeenCalledWith(
        'travel-1',
        'member-1',
        expect.objectContaining({ categoryId: validExpenseBody.categoryId }),
      );
    });
  });

  describe('GET /travels/:travelId/expenses', () => {
    it('returns 401 without auth', async () => {
      await request(app.getHttpServer())
        .get('/travels/travel-1/expenses')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('returns 403 when user is not a travel member', async () => {
      mockTravelMemberFindFirst.mockResolvedValue(null);
      const token = signToken('user-1', 'user@test.com');

      await request(app.getHttpServer())
        .get('/travels/travel-1/expenses')
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('returns 200 with pagination response', async () => {
      mockMember();
      mockFindAll.mockResolvedValue(paginatedResponse);
      const token = signToken('user-1', 'user@test.com');

      const res = await request(app.getHttpServer())
        .get('/travels/travel-1/expenses')
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK);

      expect(res.body).toMatchObject({ data: [], meta: expect.objectContaining({ page: 1 }) });
      expect(mockFindAll).toHaveBeenCalledWith('travel-1', expect.any(Object));
    });

    it('passes filter query params to service', async () => {
      mockMember();
      mockFindAll.mockResolvedValue(paginatedResponse);
      const token = signToken('user-1', 'user@test.com');

      await request(app.getHttpServer())
        .get(
          '/travels/travel-1/expenses?categoryId=550e8400-e29b-41d4-a716-446655440000&page=2&limit=10',
        )
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK);

      expect(mockFindAll).toHaveBeenCalledWith(
        'travel-1',
        expect.objectContaining({
          categoryId: '550e8400-e29b-41d4-a716-446655440000',
          page: 2,
          limit: 10,
        }),
      );
    });
  });

  describe('PATCH /travels/:travelId/expenses/:expId', () => {
    it('returns 401 without auth', async () => {
      await request(app.getHttpServer())
        .patch('/travels/travel-1/expenses/exp-1')
        .send({ description: 'Updated' })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('returns 403 when user is not a travel member', async () => {
      mockTravelMemberFindFirst.mockResolvedValue(null);
      const token = signToken('user-1', 'user@test.com');

      await request(app.getHttpServer())
        .patch('/travels/travel-1/expenses/exp-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'Updated' })
        .expect(HttpStatus.FORBIDDEN);
    });

    it('returns 200 when member updates an expense', async () => {
      mockMember();
      const updated = { id: 'exp-1', description: 'Updated', amount: 50 };
      mockUpdate.mockResolvedValue(updated);
      const token = signToken('user-1', 'user@test.com');

      const res = await request(app.getHttpServer())
        .patch('/travels/travel-1/expenses/exp-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'Updated' })
        .expect(HttpStatus.OK);

      expect(res.body).toMatchObject({ id: 'exp-1', description: 'Updated' });
      expect(mockUpdate).toHaveBeenCalledWith(
        'exp-1',
        expect.objectContaining({ id: 'member-1', role: 'member' }),
        expect.objectContaining({ description: 'Updated' }),
      );
    });
  });

  describe('DELETE /travels/:travelId/expenses/:expId', () => {
    it('returns 401 without auth', async () => {
      await request(app.getHttpServer())
        .delete('/travels/travel-1/expenses/exp-1')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('returns 403 when user is not a travel member', async () => {
      mockTravelMemberFindFirst.mockResolvedValue(null);
      const token = signToken('user-1', 'user@test.com');

      await request(app.getHttpServer())
        .delete('/travels/travel-1/expenses/exp-1')
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('returns 204 when member deletes an expense', async () => {
      mockMember();
      mockRemove.mockResolvedValue(undefined);
      const token = signToken('user-1', 'user@test.com');

      await request(app.getHttpServer())
        .delete('/travels/travel-1/expenses/exp-1')
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.NO_CONTENT);

      expect(mockRemove).toHaveBeenCalledWith(
        'exp-1',
        expect.objectContaining({ id: 'member-1', role: 'member' }),
      );
    });
  });
});
