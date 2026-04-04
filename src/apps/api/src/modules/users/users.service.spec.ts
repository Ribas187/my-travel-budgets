import { InternalServerErrorException } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { UsersService } from './users.service';

import { USER_REPOSITORY } from '@/modules/common/database';
import { EntityNotFoundError } from '@/modules/common/exceptions';
import { CloudinaryService } from '@/modules/cloudinary/cloudinary.service';

const mockFindById = jest.fn();
const mockUpdate = jest.fn();
const mockIsMemberOfTravel = jest.fn();

const userRepositoryMock = {
  findById: mockFindById,
  update: mockUpdate,
  isMemberOfTravel: mockIsMemberOfTravel,
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
        { provide: USER_REPOSITORY, useValue: userRepositoryMock },
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
        onboardingCompletedAt: null,
        dismissedTips: [],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };
      mockFindById.mockResolvedValue(user);

      const result = await service.getMe('user-1');

      expect(mockFindById).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({
        id: 'user-1',
        email: 'user@test.com',
        name: 'Test User',
        avatarUrl: 'https://example.com/avatar.png',
        mainTravelId: null,
        onboardingCompletedAt: null,
        dismissedTips: [],
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
        onboardingCompletedAt: null,
        dismissedTips: [],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };
      mockFindById.mockResolvedValue(user);

      const result = await service.getMe('user-1');

      expect(result.mainTravelId).toBe('travel-123');
    });

    it('throws EntityNotFoundError for non-existent userId', async () => {
      mockFindById.mockResolvedValue(null);

      await expect(service.getMe('non-existent')).rejects.toThrow(EntityNotFoundError);
    });
  });

  describe('updateMe', () => {
    const baseUser = {
      id: 'user-1',
      email: 'user@test.com',
      name: 'Original Name',
      avatarUrl: null as string | null,
      mainTravelId: null as string | null,
      onboardingCompletedAt: null,
      dismissedTips: [] as string[],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    };

    it('updates name only', async () => {
      const updated = { ...baseUser, name: 'New Name', updatedAt: new Date() };
      mockUpdate.mockResolvedValue(updated);

      const result = await service.updateMe('user-1', { name: 'New Name' });

      expect(mockUpdate).toHaveBeenCalledWith('user-1', { name: 'New Name' });
      expect(result.name).toBe('New Name');
    });

    it('updates avatarUrl only', async () => {
      const updated = {
        ...baseUser,
        avatarUrl: 'https://cdn.example.com/avatar.png',
        updatedAt: new Date(),
      };
      mockUpdate.mockResolvedValue(updated);

      const result = await service.updateMe('user-1', {
        avatarUrl: 'https://cdn.example.com/avatar.png',
      });

      expect(mockUpdate).toHaveBeenCalledWith('user-1', {
        avatarUrl: 'https://cdn.example.com/avatar.png',
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
      mockUpdate.mockResolvedValue(updated);

      const result = await service.updateMe('user-1', {
        name: 'New Name',
        avatarUrl: 'https://cdn.example.com/new.png',
      });

      expect(mockUpdate).toHaveBeenCalledWith('user-1', {
        name: 'New Name',
        avatarUrl: 'https://cdn.example.com/new.png',
      });
      expect(result.name).toBe('New Name');
      expect(result.avatarUrl).toBe('https://cdn.example.com/new.png');
    });

    it('does not update email even if provided in input', async () => {
      mockUpdate.mockResolvedValue(baseUser);

      await service.updateMe('user-1', {
        name: 'New Name',
        email: 'hacker@evil.com' as unknown as string,
      } as { name?: string; avatarUrl?: string });

      expect(mockUpdate).toHaveBeenCalledWith('user-1', { name: 'New Name' });
    });
  });

  describe('setMainTravel', () => {
    const baseUser = {
      id: 'user-1',
      email: 'user@test.com',
      name: 'Test User',
      avatarUrl: null,
      mainTravelId: null as string | null,
      onboardingCompletedAt: null,
      dismissedTips: [] as string[],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    };

    it('sets mainTravelId when user is a member of the travel', async () => {
      mockIsMemberOfTravel.mockResolvedValue(true);
      const updated = { ...baseUser, mainTravelId: 'travel-1' };
      mockUpdate.mockResolvedValue(updated);

      const result = await service.setMainTravel('user-1', { travelId: 'travel-1' });

      expect(mockIsMemberOfTravel).toHaveBeenCalledWith('user-1', 'travel-1');
      expect(mockUpdate).toHaveBeenCalledWith('user-1', { mainTravelId: 'travel-1' });
      expect(result.mainTravelId).toBe('travel-1');
    });

    it('changes mainTravelId to a different travel', async () => {
      mockIsMemberOfTravel.mockResolvedValue(true);
      const updated = { ...baseUser, mainTravelId: 'travel-2' };
      mockUpdate.mockResolvedValue(updated);

      const result = await service.setMainTravel('user-1', { travelId: 'travel-2' });

      expect(result.mainTravelId).toBe('travel-2');
    });

    it('clears mainTravelId when travelId is null', async () => {
      const updated = { ...baseUser, mainTravelId: null };
      mockUpdate.mockResolvedValue(updated);

      const result = await service.setMainTravel('user-1', { travelId: null });

      expect(mockIsMemberOfTravel).not.toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalledWith('user-1', { mainTravelId: null });
      expect(result.mainTravelId).toBeNull();
    });

    it('throws EntityNotFoundError when travel does not exist or user is not a member', async () => {
      mockIsMemberOfTravel.mockResolvedValue(false);

      await expect(
        service.setMainTravel('user-1', { travelId: 'non-existent-travel' }),
      ).rejects.toThrow(EntityNotFoundError);

      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  describe('uploadAvatar', () => {
    const baseUser = {
      id: 'user-1',
      email: 'user@test.com',
      name: 'Test User',
      avatarUrl: null as string | null,
      mainTravelId: null as string | null,
      onboardingCompletedAt: null,
      dismissedTips: [] as string[],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    };

    const mockFile = {
      buffer: Buffer.from('fake-image'),
      mimetype: 'image/jpeg',
      size: 1024,
    } as Express.Multer.File;

    it('uploads avatar and stores the URL', async () => {
      mockFindById.mockResolvedValue({ ...baseUser });
      mockCloudinaryUpload.mockResolvedValue({
        secure_url: 'https://res.cloudinary.com/test/avatars/user-1.jpg',
        public_id: 'avatars/user-1',
      });
      const updated = {
        ...baseUser,
        avatarUrl: 'https://res.cloudinary.com/test/avatars/user-1.jpg',
      };
      mockUpdate.mockResolvedValue(updated);

      const result = await service.uploadAvatar('user-1', mockFile);

      expect(mockCloudinaryUpload).toHaveBeenCalledWith(mockFile.buffer, 'user-1', 'avatars');
      expect(mockUpdate).toHaveBeenCalledWith('user-1', {
        avatarUrl: 'https://res.cloudinary.com/test/avatars/user-1.jpg',
      });
      expect(result.avatarUrl).toBe('https://res.cloudinary.com/test/avatars/user-1.jpg');
    });

    it('deletes old avatar before uploading new one', async () => {
      const userWithAvatar = {
        ...baseUser,
        avatarUrl: 'https://res.cloudinary.com/test/avatars/user-1-old.jpg',
      };
      mockFindById.mockResolvedValue(userWithAvatar);
      mockCloudinaryDestroy.mockResolvedValue(undefined);
      mockCloudinaryUpload.mockResolvedValue({
        secure_url: 'https://res.cloudinary.com/test/avatars/user-1.jpg',
        public_id: 'avatars/user-1',
      });
      mockUpdate.mockResolvedValue({
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
      mockFindById.mockResolvedValue(userWithAvatar);
      mockCloudinaryDestroy.mockRejectedValue(new Error('Destroy failed'));
      mockCloudinaryUpload.mockResolvedValue({
        secure_url: 'https://res.cloudinary.com/test/avatars/user-1.jpg',
        public_id: 'avatars/user-1',
      });
      mockUpdate.mockResolvedValue({
        ...baseUser,
        avatarUrl: 'https://res.cloudinary.com/test/avatars/user-1.jpg',
      });

      const result = await service.uploadAvatar('user-1', mockFile);

      expect(result.avatarUrl).toBe('https://res.cloudinary.com/test/avatars/user-1.jpg');
    });

    it('throws InternalServerErrorException when upload fails', async () => {
      mockFindById.mockResolvedValue({ ...baseUser });
      mockCloudinaryUpload.mockRejectedValue(new Error('Cloudinary down'));

      await expect(service.uploadAvatar('user-1', mockFile)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('throws EntityNotFoundError for non-existent user', async () => {
      mockFindById.mockResolvedValue(null);

      await expect(service.uploadAvatar('non-existent', mockFile)).rejects.toThrow(
        EntityNotFoundError,
      );
    });

    it('does not call destroy when user has no existing avatar', async () => {
      mockFindById.mockResolvedValue({ ...baseUser, avatarUrl: null });
      mockCloudinaryUpload.mockResolvedValue({
        secure_url: 'https://res.cloudinary.com/test/avatars/user-1.jpg',
        public_id: 'avatars/user-1',
      });
      mockUpdate.mockResolvedValue({
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
      onboardingCompletedAt: null,
      dismissedTips: [] as string[],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    };

    it('deletes avatar from Cloudinary and sets avatarUrl to null', async () => {
      mockFindById.mockResolvedValue({ ...baseUser });
      mockCloudinaryDestroy.mockResolvedValue(undefined);
      mockUpdate.mockResolvedValue({ ...baseUser, avatarUrl: null });

      const result = await service.removeAvatar('user-1');

      expect(mockCloudinaryDestroy).toHaveBeenCalledWith('avatars/user-1');
      expect(mockUpdate).toHaveBeenCalledWith('user-1', { avatarUrl: null });
      expect(result.avatarUrl).toBeNull();
    });

    it('sets avatarUrl to null even when destroy fails', async () => {
      mockFindById.mockResolvedValue({ ...baseUser });
      mockCloudinaryDestroy.mockRejectedValue(new Error('Destroy failed'));
      mockUpdate.mockResolvedValue({ ...baseUser, avatarUrl: null });

      const result = await service.removeAvatar('user-1');

      expect(result.avatarUrl).toBeNull();
    });

    it('skips destroy when user has no avatar', async () => {
      mockFindById.mockResolvedValue({ ...baseUser, avatarUrl: null });
      mockUpdate.mockResolvedValue({ ...baseUser, avatarUrl: null });

      await service.removeAvatar('user-1');

      expect(mockCloudinaryDestroy).not.toHaveBeenCalled();
    });

    it('throws EntityNotFoundError for non-existent user', async () => {
      mockFindById.mockResolvedValue(null);

      await expect(service.removeAvatar('non-existent')).rejects.toThrow(EntityNotFoundError);
    });
  });
});
