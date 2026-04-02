import { HttpStatus, ValidationPipe } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import type { INestApplication } from '@nestjs/common';

import { MembersController } from './members.controller';
import { MembersService } from './members.service';

import { CommonAuthModule } from '@/modules/common/auth';
import { PrismaService } from '@/modules/prisma/prisma.service';

const TEST_JWT_SECRET = 'unit-test-jwt-secret-min-32-characters!!';

const mockAddMember = jest.fn();
const mockRemoveMember = jest.fn();

const membersServiceMock = {
  addMember: mockAddMember,
  removeMember: mockRemoveMember,
};

const mockTravelMemberFindFirst = jest.fn();

const prismaServiceMock = {
  travelMember: {
    findFirst: mockTravelMemberFindFirst,
  },
};

describe('MembersController', () => {
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
        CommonAuthModule,
      ],
      controllers: [MembersController],
      providers: [
        { provide: MembersService, useValue: membersServiceMock },
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

  describe('POST /travels/:travelId/members', () => {
    it('returns 401 without auth', async () => {
      await request(app.getHttpServer())
        .post('/travels/travel-1/members')
        .send({ email: 'member@test.com' })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('returns 403 when user is not a travel member', async () => {
      mockTravelMemberFindFirst.mockResolvedValue(null);

      const token = signToken('user-1', 'user@test.com');

      await request(app.getHttpServer())
        .post('/travels/travel-1/members')
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'member@test.com' })
        .expect(HttpStatus.FORBIDDEN);
    });

    it('returns 403 when user is not the owner', async () => {
      mockRegularMember();

      const token = signToken('user-1', 'user@test.com');

      await request(app.getHttpServer())
        .post('/travels/travel-1/members')
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'member@test.com' })
        .expect(HttpStatus.FORBIDDEN);
    });

    it('returns 201 when owner adds a member by email', async () => {
      mockOwnerMember();
      const createdMember = {
        id: 'member-new',
        travelId: 'travel-1',
        userId: 'user-2',
        role: 'member',
      };
      mockAddMember.mockResolvedValue(createdMember);

      const token = signToken('user-1', 'user@test.com');

      const res = await request(app.getHttpServer())
        .post('/travels/travel-1/members')
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'member@test.com' })
        .expect(HttpStatus.CREATED);

      expect(res.body).toMatchObject({ id: 'member-new', role: 'member' });
      expect(mockAddMember).toHaveBeenCalledWith(
        'travel-1',
        expect.objectContaining({ email: 'member@test.com' }),
      );
    });

    it('returns 201 when owner adds a guest', async () => {
      mockOwnerMember();
      const createdMember = {
        id: 'member-guest',
        travelId: 'travel-1',
        guestName: 'John Doe',
        userId: null,
        role: 'member',
      };
      mockAddMember.mockResolvedValue(createdMember);

      const token = signToken('user-1', 'user@test.com');

      const res = await request(app.getHttpServer())
        .post('/travels/travel-1/members')
        .set('Authorization', `Bearer ${token}`)
        .send({ guestName: 'John Doe' })
        .expect(HttpStatus.CREATED);

      expect(res.body.guestName).toBe('John Doe');
    });

    it('returns 400 when both email and guestName are provided', async () => {
      mockOwnerMember();

      const token = signToken('user-1', 'user@test.com');

      await request(app.getHttpServer())
        .post('/travels/travel-1/members')
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'member@test.com', guestName: 'John Doe' })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('returns 400 when neither email nor guestName is provided', async () => {
      mockOwnerMember();

      const token = signToken('user-1', 'user@test.com');

      await request(app.getHttpServer())
        .post('/travels/travel-1/members')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('DELETE /travels/:travelId/members/:memberId', () => {
    it('returns 403 when user is not owner', async () => {
      mockRegularMember();

      const token = signToken('user-1', 'user@test.com');

      await request(app.getHttpServer())
        .delete('/travels/travel-1/members/member-2')
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('returns 204 when owner removes a member', async () => {
      mockOwnerMember();
      mockRemoveMember.mockResolvedValue(undefined);

      const token = signToken('user-1', 'user@test.com');

      await request(app.getHttpServer())
        .delete('/travels/travel-1/members/member-2')
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.NO_CONTENT);

      expect(mockRemoveMember).toHaveBeenCalledWith('travel-1', 'member-2');
    });
  });
});
