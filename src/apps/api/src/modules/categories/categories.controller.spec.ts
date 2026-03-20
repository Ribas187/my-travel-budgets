import { HttpStatus, ValidationPipe } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import type { INestApplication } from '@nestjs/common';

import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

import { CommonAuthModule } from '@/modules/common/auth';
import { PrismaService } from '@/modules/prisma/prisma.service';

const TEST_JWT_SECRET = 'unit-test-jwt-secret-min-32-characters!!';

const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockRemove = jest.fn();

const categoriesServiceMock = {
  create: mockCreate,
  update: mockUpdate,
  remove: mockRemove,
};

const mockTravelMemberFindFirst = jest.fn();

const prismaServiceMock = {
  travelMember: {
    findFirst: mockTravelMemberFindFirst,
  },
};

describe('CategoriesController', () => {
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
      controllers: [CategoriesController],
      providers: [
        { provide: CategoriesService, useValue: categoriesServiceMock },
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

  function mockOwnerMember() {
    mockTravelMemberFindFirst.mockResolvedValue({
      id: 'member-1',
      travelId: 'travel-1',
      userId: 'user-1',
      role: 'owner',
    });
  }

  function mockRegularMember() {
    mockTravelMemberFindFirst.mockResolvedValue({
      id: 'member-2',
      travelId: 'travel-1',
      userId: 'user-1',
      role: 'member',
    });
  }

  describe('POST /travels/:travelId/categories', () => {
    it('returns 401 without auth', async () => {
      await request(app.getHttpServer())
        .post('/travels/travel-1/categories')
        .send({ name: 'Food', icon: 'utensils', color: '#FF0000' })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('returns 403 when user is not a travel member', async () => {
      mockTravelMemberFindFirst.mockResolvedValue(null);
      const token = signToken('user-1', 'user@test.com');

      await request(app.getHttpServer())
        .post('/travels/travel-1/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Food', icon: 'utensils', color: '#FF0000' })
        .expect(HttpStatus.FORBIDDEN);
    });

    it('returns 403 when user is not the owner', async () => {
      mockRegularMember();
      const token = signToken('user-1', 'user@test.com');

      await request(app.getHttpServer())
        .post('/travels/travel-1/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Food', icon: 'utensils', color: '#FF0000' })
        .expect(HttpStatus.FORBIDDEN);
    });

    it('returns 400 when color is not a valid hex', async () => {
      mockOwnerMember();
      const token = signToken('user-1', 'user@test.com');

      await request(app.getHttpServer())
        .post('/travels/travel-1/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Food', icon: 'utensils', color: 'red' })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('returns 400 when required fields are missing', async () => {
      mockOwnerMember();
      const token = signToken('user-1', 'user@test.com');

      await request(app.getHttpServer())
        .post('/travels/travel-1/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Food' })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('returns 201 when owner creates a category', async () => {
      mockOwnerMember();
      const created = {
        id: 'cat-1',
        travelId: 'travel-1',
        name: 'Food',
        icon: 'utensils',
        color: '#FF0000',
        budgetLimit: null,
      };
      mockCreate.mockResolvedValue(created);
      const token = signToken('user-1', 'user@test.com');

      const res = await request(app.getHttpServer())
        .post('/travels/travel-1/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Food', icon: 'utensils', color: '#FF0000' })
        .expect(HttpStatus.CREATED);

      expect(res.body).toMatchObject({ id: 'cat-1', name: 'Food' });
      expect(mockCreate).toHaveBeenCalledWith(
        'travel-1',
        expect.objectContaining({ name: 'Food', icon: 'utensils', color: '#FF0000' }),
      );
    });

    it('returns 201 when owner creates a category with budgetLimit', async () => {
      mockOwnerMember();
      const created = {
        id: 'cat-1',
        travelId: 'travel-1',
        name: 'Food',
        icon: 'utensils',
        color: '#FF0000',
        budgetLimit: 500,
      };
      mockCreate.mockResolvedValue(created);
      const token = signToken('user-1', 'user@test.com');

      const res = await request(app.getHttpServer())
        .post('/travels/travel-1/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Food', icon: 'utensils', color: '#FF0000', budgetLimit: 500 })
        .expect(HttpStatus.CREATED);

      expect(res.body.budgetLimit).toBe(500);
    });
  });

  describe('PATCH /travels/:travelId/categories/:catId', () => {
    it('returns 403 when user is not owner', async () => {
      mockRegularMember();
      const token = signToken('user-1', 'user@test.com');

      await request(app.getHttpServer())
        .patch('/travels/travel-1/categories/cat-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Dining' })
        .expect(HttpStatus.FORBIDDEN);
    });

    it('returns 200 when owner updates a category', async () => {
      mockOwnerMember();
      const updated = {
        id: 'cat-1',
        travelId: 'travel-1',
        name: 'Dining',
        icon: 'utensils',
        color: '#FF0000',
        budgetLimit: null,
      };
      mockUpdate.mockResolvedValue(updated);
      const token = signToken('user-1', 'user@test.com');

      const res = await request(app.getHttpServer())
        .patch('/travels/travel-1/categories/cat-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Dining' })
        .expect(HttpStatus.OK);

      expect(res.body).toMatchObject({ id: 'cat-1', name: 'Dining' });
      expect(mockUpdate).toHaveBeenCalledWith(
        'travel-1',
        'cat-1',
        expect.objectContaining({ name: 'Dining' }),
      );
    });

    it('returns 400 for invalid color format', async () => {
      mockOwnerMember();
      const token = signToken('user-1', 'user@test.com');

      await request(app.getHttpServer())
        .patch('/travels/travel-1/categories/cat-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ color: 'not-a-hex' })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('DELETE /travels/:travelId/categories/:catId', () => {
    it('returns 403 when user is not owner', async () => {
      mockRegularMember();
      const token = signToken('user-1', 'user@test.com');

      await request(app.getHttpServer())
        .delete('/travels/travel-1/categories/cat-1')
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('returns 204 when owner deletes a category', async () => {
      mockOwnerMember();
      mockRemove.mockResolvedValue(undefined);
      const token = signToken('user-1', 'user@test.com');

      await request(app.getHttpServer())
        .delete('/travels/travel-1/categories/cat-1')
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.NO_CONTENT);

      expect(mockRemove).toHaveBeenCalledWith('travel-1', 'cat-1');
    });
  });
});
