import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { UsersService } from './users.service';

import { PrismaService } from '@/modules/prisma/prisma.service';
import { CloudinaryService } from '@/modules/cloudinary/cloudinary.service';

const mockUserFindUnique = jest.fn();
const mockUserUpdate = jest.fn();
const mockTravelMemberFindFirst = jest.fn();

const prismaServiceMock = {
  user: {
    findUnique: mockUserFindUnique,
    update: mockUserUpdate,
  },
  travelMember: {
    findFirst: mockTravelMemberFindFirst,
  },
};

const mockCloudinaryUpload = jest.fn();
const mockCloudinaryDestroy = jest.fn();

const cloudinaryServiceMock = {
  upload: mockCloudinaryUpload,
  destroy: mockCloudinaryDestroy,
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prismaServiceMock },
        { provide: CloudinaryService, useValue: cloudinaryServiceMock },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('getMe', () => {
    it('returns user profile with mainTravelId for valid userId', async () => {
      const user = {
        id: 'user-1',
        email: 'user@test.com',
        name: 'Test User',
        avatarUrl: 'https://example.com/avatar.png',
        mainTravelId: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };
      mockUserFindUnique.mockResolvedValue(user);

      const result = await service.getMe('user-1');

      expect(mockUserFindUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
      expect(result).toEqual({
        id: 'user-1',
        email: 'user@test.com',
        name: 'Test User',
        avatarUrl: 'https://example.com/avatar.png',
        mainTravelId: null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    });

    it('returns mainTravelId when set', async () => {
      const user = {
        id: 'user-1',
        email: 'user@test.com',
        name: 'Test User',
        avatarUrl: null,
        mainTravelId: 'travel-123',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };
      mockUserFindUnique.mockResolvedValue(user);

      const result = await service.getMe('user-1');

      expect(result.mainTravelId).toBe('travel-123');
    });

    it('throws NotFoundException for non-existent userId', async () => {
      mockUserFindUnique.mockResolvedValue(null);

      await expect(service.getMe('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateMe', () => {
    const baseUser = {
      id: 'user-1',
      email: 'user@test.com',
      name: 'Original Name',
      avatarUrl: null as string | null,
      mainTravelId: null as string | null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    };

    it('updates name only', async () => {
      const updated = { ...baseUser, name: 'New Name', updatedAt: new Date() };
      mockUserUpdate.mockResolvedValue(updated);

      const result = await service.updateMe('user-1', { name: 'New Name' });

      expect(mockUserUpdate).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { name: 'New Name' },
      });
      expect(result.name).toBe('New Name');
    });

    it('updates avatarUrl only', async () => {
      const updated = {
        ...baseUser,
        avatarUrl: 'https://cdn.example.com/avatar.png',
        updatedAt: new Date(),
      };
      mockUserUpdate.mockResolvedValue(updated);

      const result = await service.updateMe('user-1', {
        avatarUrl: 'https://cdn.example.com/avatar.png',
      });

      expect(mockUserUpdate).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { avatarUrl: 'https://cdn.example.com/avatar.png' },
      });
      expect(result.avatarUrl).toBe('https://cdn.example.com/avatar.png');
    });

    it('updates both name and avatarUrl', async () => {
      const updated = {
        ...baseUser,
        name: 'New Name',
        avatarUrl: 'https://cdn.example.com/new.png',
        updatedAt: new Date(),
      };
      mockUserUpdate.mockResolvedValue(updated);

      const result = await service.updateMe('user-1', {
        name: 'New Name',
        avatarUrl: 'https://cdn.example.com/new.png',
      });

      expect(mockUserUpdate).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { name: 'New Name', avatarUrl: 'https://cdn.example.com/new.png' },
      });
      expect(result.name).toBe('New Name');
      expect(result.avatarUrl).toBe('https://cdn.example.com/new.png');
    });

    it('does not update email even if provided in input', async () => {
      mockUserUpdate.mockResolvedValue(baseUser);

      await service.updateMe('user-1', {
        name: 'New Name',
        email: 'hacker@evil.com' as unknown as string,
      } as { name?: string; avatarUrl?: string });

      expect(mockUserUpdate).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { name: 'New Name' },
      });
    });
  });

  describe('setMainTravel', () => {
    const baseUser = {
      id: 'user-1',
      email: 'user@test.com',
      name: 'Test User',
      avatarUrl: null,
      mainTravelId: null as string | null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    };

    it('sets mainTravelId when user is a member of the travel', async () => {
      mockTravelMemberFindFirst.mockResolvedValue({
        id: 'member-1',
        travelId: 'travel-1',
        userId: 'user-1',
        role: 'owner',
      });
      const updated = { ...baseUser, mainTravelId: 'travel-1' };
      mockUserUpdate.mockResolvedValue(updated);

      const result = await service.setMainTravel('user-1', { travelId: 'travel-1' });

      expect(mockTravelMemberFindFirst).toHaveBeenCalledWith({
        where: { travelId: 'travel-1', userId: 'user-1' },
      });
      expect(mockUserUpdate).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { mainTravelId: 'travel-1' },
      });
      expect(result.mainTravelId).toBe('travel-1');
    });

    it('changes mainTravelId to a different travel', async () => {
      mockTravelMemberFindFirst.mockResolvedValue({
        id: 'member-1',
        travelId: 'travel-2',
        userId: 'user-1',
        role: 'member',
      });
      const updated = { ...baseUser, mainTravelId: 'travel-2' };
      mockUserUpdate.mockResolvedValue(updated);

      const result = await service.setMainTravel('user-1', { travelId: 'travel-2' });

      expect(result.mainTravelId).toBe('travel-2');
    });

    it('clears mainTravelId when travelId is null', async () => {
      const updated = { ...baseUser, mainTravelId: null };
      mockUserUpdate.mockResolvedValue(updated);

      const result = await service.setMainTravel('user-1', { travelId: null });

      expect(mockTravelMemberFindFirst).not.toHaveBeenCalled();
      expect(mockUserUpdate).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { mainTravelId: null },
      });
      expect(result.mainTravelId).toBeNull();
    });

    it('throws NotFoundException when travel does not exist or user is not a member', async () => {
      mockTravelMemberFindFirst.mockResolvedValue(null);

      await expect(
        service.setMainTravel('user-1', { travelId: 'non-existent-travel' }),
      ).rejects.toThrow(NotFoundException);

      expect(mockUserUpdate).not.toHaveBeenCalled();
    });
  });

  describe('uploadAvatar', () => {
    const baseUser = {
      id: 'user-1',
      email: 'user@test.com',
      name: 'Test User',
      avatarUrl: null as string | null,
      mainTravelId: null as string | null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    };

    const mockFile = {
      buffer: Buffer.from('fake-image'),
      mimetype: 'image/jpeg',
      size: 1024,
    } as Express.Multer.File;

    it('uploads avatar and stores the URL', async () => {
      mockUserFindUnique.mockResolvedValue({ ...baseUser });
      mockCloudinaryUpload.mockResolvedValue({
        secure_url: 'https://res.cloudinary.com/test/avatars/user-1.jpg',
        public_id: 'avatars/user-1',
      });
      const updated = {
        ...baseUser,
        avatarUrl: 'https://res.cloudinary.com/test/avatars/user-1.jpg',
      };
      mockUserUpdate.mockResolvedValue(updated);

      const result = await service.uploadAvatar('user-1', mockFile);

      expect(mockCloudinaryUpload).toHaveBeenCalledWith(mockFile.buffer, 'user-1', 'avatars');
      expect(mockUserUpdate).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { avatarUrl: 'https://res.cloudinary.com/test/avatars/user-1.jpg' },
      });
      expect(result.avatarUrl).toBe('https://res.cloudinary.com/test/avatars/user-1.jpg');
    });

    it('deletes old avatar before uploading new one', async () => {
      const userWithAvatar = {
        ...baseUser,
        avatarUrl: 'https://res.cloudinary.com/test/avatars/user-1-old.jpg',
      };
      mockUserFindUnique.mockResolvedValue(userWithAvatar);
      mockCloudinaryDestroy.mockResolvedValue(undefined);
      mockCloudinaryUpload.mockResolvedValue({
        secure_url: 'https://res.cloudinary.com/test/avatars/user-1.jpg',
        public_id: 'avatars/user-1',
      });
      mockUserUpdate.mockResolvedValue({
        ...baseUser,
        avatarUrl: 'https://res.cloudinary.com/test/avatars/user-1.jpg',
      });

      await service.uploadAvatar('user-1', mockFile);

      expect(mockCloudinaryDestroy).toHaveBeenCalledWith('avatars/user-1');
      expect(mockCloudinaryUpload).toHaveBeenCalled();
    });

    it('proceeds with upload even if old avatar deletion fails', async () => {
      const userWithAvatar = {
        ...baseUser,
        avatarUrl: 'https://res.cloudinary.com/test/avatars/user-1-old.jpg',
      };
      mockUserFindUnique.mockResolvedValue(userWithAvatar);
      mockCloudinaryDestroy.mockRejectedValue(new Error('Destroy failed'));
      mockCloudinaryUpload.mockResolvedValue({
        secure_url: 'https://res.cloudinary.com/test/avatars/user-1.jpg',
        public_id: 'avatars/user-1',
      });
      mockUserUpdate.mockResolvedValue({
        ...baseUser,
        avatarUrl: 'https://res.cloudinary.com/test/avatars/user-1.jpg',
      });

      const result = await service.uploadAvatar('user-1', mockFile);

      expect(result.avatarUrl).toBe('https://res.cloudinary.com/test/avatars/user-1.jpg');
    });

    it('throws InternalServerErrorException when upload fails', async () => {
      mockUserFindUnique.mockResolvedValue({ ...baseUser });
      mockCloudinaryUpload.mockRejectedValue(new Error('Cloudinary down'));

      await expect(service.uploadAvatar('user-1', mockFile)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('throws NotFoundException for non-existent user', async () => {
      mockUserFindUnique.mockResolvedValue(null);

      await expect(service.uploadAvatar('non-existent', mockFile)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('does not call destroy when user has no existing avatar', async () => {
      mockUserFindUnique.mockResolvedValue({ ...baseUser, avatarUrl: null });
      mockCloudinaryUpload.mockResolvedValue({
        secure_url: 'https://res.cloudinary.com/test/avatars/user-1.jpg',
        public_id: 'avatars/user-1',
      });
      mockUserUpdate.mockResolvedValue({
        ...baseUser,
        avatarUrl: 'https://res.cloudinary.com/test/avatars/user-1.jpg',
      });

      await service.uploadAvatar('user-1', mockFile);

      expect(mockCloudinaryDestroy).not.toHaveBeenCalled();
    });
  });

  describe('removeAvatar', () => {
    const baseUser = {
      id: 'user-1',
      email: 'user@test.com',
      name: 'Test User',
      avatarUrl: 'https://res.cloudinary.com/test/avatars/user-1.jpg' as string | null,
      mainTravelId: null as string | null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    };

    it('deletes avatar from Cloudinary and sets avatarUrl to null', async () => {
      mockUserFindUnique.mockResolvedValue({ ...baseUser });
      mockCloudinaryDestroy.mockResolvedValue(undefined);
      mockUserUpdate.mockResolvedValue({ ...baseUser, avatarUrl: null });

      const result = await service.removeAvatar('user-1');

      expect(mockCloudinaryDestroy).toHaveBeenCalledWith('avatars/user-1');
      expect(mockUserUpdate).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { avatarUrl: null },
      });
      expect(result.avatarUrl).toBeNull();
    });

    it('sets avatarUrl to null even when destroy fails', async () => {
      mockUserFindUnique.mockResolvedValue({ ...baseUser });
      mockCloudinaryDestroy.mockRejectedValue(new Error('Destroy failed'));
      mockUserUpdate.mockResolvedValue({ ...baseUser, avatarUrl: null });

      const result = await service.removeAvatar('user-1');

      expect(result.avatarUrl).toBeNull();
    });

    it('skips destroy when user has no avatar', async () => {
      mockUserFindUnique.mockResolvedValue({ ...baseUser, avatarUrl: null });
      mockUserUpdate.mockResolvedValue({ ...baseUser, avatarUrl: null });

      await service.removeAvatar('user-1');

      expect(mockCloudinaryDestroy).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for non-existent user', async () => {
      mockUserFindUnique.mockResolvedValue(null);

      await expect(service.removeAvatar('non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});
