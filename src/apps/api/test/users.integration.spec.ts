import { config as loadEnv } from 'dotenv';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';

import { validateEnv } from '@/config/env.validation';
import { CloudinaryService } from '@/modules/cloudinary/cloudinary.service';
import { USER_REPOSITORY } from '@/modules/common/database';
import { PrismaModule } from '@/modules/prisma/prisma.module';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { UsersService } from '@/modules/users/users.service';
import { PrismaUserRepository } from '@/modules/users/repository/user.repository.prisma';

const cloudinaryServiceMock = {
  upload: jest.fn(),
  destroy: jest.fn(),
};

describe('Users integration tests', () => {
  let moduleRef: TestingModule;
  let prisma: PrismaService;
  let usersService: UsersService;

  beforeAll(async () => {
    loadEnv({ path: '.env.local', quiet: true });
    loadEnv({ path: '.env', quiet: true });

    const required: Record<string, string> = {
      DATABASE_URL: process.env.DATABASE_URL ?? '',
      JWT_SECRET: process.env.JWT_SECRET ?? 'integration-test-secret-min-32-chars!!',
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '30d',
      RESEND_API_KEY: process.env.RESEND_API_KEY ?? 're_integration_placeholder',
      PORT: process.env.PORT ?? '3000',
    };
    for (const [key, value] of Object.entries(required)) {
      if (!process.env[key]) process.env[key] = value;
    }
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL must be set (or present in .env) for integration tests');
    }

    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          validate: validateEnv,
          envFilePath: ['.env.local', '.env'],
        }),
        PrismaModule,
      ],
      providers: [
        UsersService,
        { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
        { provide: CloudinaryService, useValue: cloudinaryServiceMock },
      ],
    }).compile();

    await moduleRef.init();
    prisma = moduleRef.get(PrismaService);
    usersService = moduleRef.get(UsersService);
  });

  afterAll(async () => {
    await moduleRef?.close();
  });

  afterEach(async () => {
    await prisma.user.deleteMany({});
  });

  describe('Task 5: User profile management', () => {
    it('profile fetch returns persisted user data', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'profile-fetch@test.com',
          name: 'Profile Fetch User',
          avatarUrl: 'https://example.com/avatar.png',
        },
      });

      const profile = await usersService.getMe(user.id);

      expect(profile).toMatchObject({
        id: user.id,
        email: 'profile-fetch@test.com',
        name: 'Profile Fetch User',
        avatarUrl: 'https://example.com/avatar.png',
      });
      expect(profile.createdAt).toBeInstanceOf(Date);
      expect(profile.updatedAt).toBeInstanceOf(Date);
    });

    it('profile update persists changes and subsequent fetch reflects them', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'profile-update@test.com',
          name: 'Original Name',
          avatarUrl: null,
        },
      });

      const updated = await usersService.updateMe(user.id, {
        name: 'Updated Name',
        avatarUrl: 'https://cdn.example.com/new-avatar.png',
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.avatarUrl).toBe('https://cdn.example.com/new-avatar.png');

      const refetched = await usersService.getMe(user.id);
      expect(refetched.name).toBe('Updated Name');
      expect(refetched.avatarUrl).toBe('https://cdn.example.com/new-avatar.png');

      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
      });
      expect(dbUser?.name).toBe('Updated Name');
      expect(dbUser?.avatarUrl).toBe('https://cdn.example.com/new-avatar.png');
    });
  });
});
