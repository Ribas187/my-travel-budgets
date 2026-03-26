import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { MembersService } from './members.service';

import { MEMBER_REPOSITORY } from '@/modules/common/database';
import {
  BusinessValidationError,
  ConflictError,
  EntityNotFoundError,
} from '@/modules/common/exceptions';

const mockFindUserByEmail = jest.fn();
const mockFindByIdAndTravel = jest.fn();
const mockCreateMember = jest.fn();
const mockDelete = jest.fn();

const memberRepositoryMock = {
  findUserByEmail: mockFindUserByEmail,
  findByIdAndTravel: mockFindByIdAndTravel,
  createMember: mockCreateMember,
  delete: mockDelete,
};

describe('MembersService', () => {
  let service: MembersService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembersService,
        { provide: MEMBER_REPOSITORY, useValue: memberRepositoryMock },
      ],
    }).compile();

    service = module.get<MembersService>(MembersService);
  });

  describe('addMember', () => {
    it('adds a member by email when user is found', async () => {
      const user = { id: 'user-2', email: 'member@test.com', name: 'Member' };
      mockFindUserByEmail.mockResolvedValue(user);

      const createdMember = {
        id: 'member-1',
        travelId: 'travel-1',
        userId: 'user-2',
        role: 'member',
      };
      mockCreateMember.mockResolvedValue(createdMember);

      const result = await service.addMember('travel-1', {
        email: 'member@test.com',
      });

      expect(mockFindUserByEmail).toHaveBeenCalledWith('member@test.com');
      expect(mockCreateMember).toHaveBeenCalledWith({
        travelId: 'travel-1',
        userId: 'user-2',
        role: 'member',
      });
      expect(result).toEqual(createdMember);
    });

    it('throws EntityNotFoundError when email does not match a registered user', async () => {
      mockFindUserByEmail.mockResolvedValue(null);

      await expect(service.addMember('travel-1', { email: 'unknown@test.com' })).rejects.toThrow(
        EntityNotFoundError,
      );

      await expect(service.addMember('travel-1', { email: 'unknown@test.com' })).rejects.toThrow(
        'User not found. You can add them as a named guest instead.',
      );
    });

    it('throws ConflictError on duplicate member', async () => {
      const user = { id: 'user-2', email: 'member@test.com', name: 'Member' };
      mockFindUserByEmail.mockResolvedValue(user);

      mockCreateMember.mockRejectedValue(
        new ConflictError('User is already a member of this travel'),
      );

      await expect(service.addMember('travel-1', { email: 'member@test.com' })).rejects.toThrow(
        ConflictError,
      );
    });

    it('adds a guest member when guestName is provided', async () => {
      const createdMember = {
        id: 'member-2',
        travelId: 'travel-1',
        guestName: 'John Doe',
        userId: null,
        role: 'member',
      };
      mockCreateMember.mockResolvedValue(createdMember);

      const result = await service.addMember('travel-1', {
        guestName: 'John Doe',
      });

      expect(mockCreateMember).toHaveBeenCalledWith({
        travelId: 'travel-1',
        guestName: 'John Doe',
        role: 'member',
      });
      expect(result.userId).toBeNull();
      expect(result.guestName).toBe('John Doe');
    });

    it('re-throws non-conflict errors', async () => {
      const user = { id: 'user-2', email: 'member@test.com', name: 'Member' };
      mockFindUserByEmail.mockResolvedValue(user);

      const genericError = new Error('Database connection lost');
      mockCreateMember.mockRejectedValue(genericError);

      await expect(service.addMember('travel-1', { email: 'member@test.com' })).rejects.toThrow(
        'Database connection lost',
      );
    });
  });

  describe('removeMember', () => {
    it('removes a member successfully', async () => {
      mockFindByIdAndTravel.mockResolvedValue({
        id: 'member-2',
        travelId: 'travel-1',
        userId: 'user-2',
        role: 'member',
      });
      mockDelete.mockResolvedValue(undefined);

      await service.removeMember('travel-1', 'member-2');

      expect(mockFindByIdAndTravel).toHaveBeenCalledWith('member-2', 'travel-1');
      expect(mockDelete).toHaveBeenCalledWith('member-2');
    });

    it('throws EntityNotFoundError when member does not exist', async () => {
      mockFindByIdAndTravel.mockResolvedValue(null);

      await expect(service.removeMember('travel-1', 'non-existent')).rejects.toThrow(
        EntityNotFoundError,
      );
    });

    it('throws BusinessValidationError when trying to remove the owner', async () => {
      mockFindByIdAndTravel.mockResolvedValue({
        id: 'member-1',
        travelId: 'travel-1',
        userId: 'user-1',
        role: 'owner',
      });

      await expect(service.removeMember('travel-1', 'member-1')).rejects.toThrow(
        BusinessValidationError,
      );

      await expect(service.removeMember('travel-1', 'member-1')).rejects.toThrow(
        'Cannot remove the travel owner',
      );
    });
  });
});
