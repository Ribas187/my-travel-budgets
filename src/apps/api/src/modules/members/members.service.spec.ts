import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';

import { MembersService } from './members.service';

import { PrismaService } from '@/modules/prisma/prisma.service';

const mockUserFindUnique = jest.fn();
const mockTravelMemberCreate = jest.fn();
const mockTravelMemberFindFirst = jest.fn();
const mockTravelMemberDelete = jest.fn();

const prismaServiceMock = {
  user: {
    findUnique: mockUserFindUnique,
  },
  travelMember: {
    create: mockTravelMemberCreate,
    findFirst: mockTravelMemberFindFirst,
    delete: mockTravelMemberDelete,
  },
};

describe('MembersService', () => {
  let service: MembersService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [MembersService, { provide: PrismaService, useValue: prismaServiceMock }],
    }).compile();

    service = module.get<MembersService>(MembersService);
  });

  describe('addMember', () => {
    it('adds a member by email when user is found', async () => {
      const user = { id: 'user-2', email: 'member@test.com', name: 'Member' };
      mockUserFindUnique.mockResolvedValue(user);

      const createdMember = {
        id: 'member-1',
        travelId: 'travel-1',
        userId: 'user-2',
        role: 'member',
      };
      mockTravelMemberCreate.mockResolvedValue(createdMember);

      const result = await service.addMember('travel-1', {
        email: 'member@test.com',
      });

      expect(mockUserFindUnique).toHaveBeenCalledWith({
        where: { email: 'member@test.com' },
      });
      expect(mockTravelMemberCreate).toHaveBeenCalledWith({
        data: {
          travelId: 'travel-1',
          userId: 'user-2',
          role: 'member',
        },
      });
      expect(result).toEqual(createdMember);
    });

    it('throws NotFoundException when email does not match a registered user', async () => {
      mockUserFindUnique.mockResolvedValue(null);

      await expect(service.addMember('travel-1', { email: 'unknown@test.com' })).rejects.toThrow(
        NotFoundException,
      );

      await expect(service.addMember('travel-1', { email: 'unknown@test.com' })).rejects.toThrow(
        'User not found. You can add them as a named guest instead.',
      );
    });

    it('throws ConflictException on duplicate member (P2002)', async () => {
      const user = { id: 'user-2', email: 'member@test.com', name: 'Member' };
      mockUserFindUnique.mockResolvedValue(user);

      const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint violation', {
        code: 'P2002',
        clientVersion: '5.0.0',
      });
      mockTravelMemberCreate.mockRejectedValue(prismaError);

      await expect(service.addMember('travel-1', { email: 'member@test.com' })).rejects.toThrow(
        ConflictException,
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
      mockTravelMemberCreate.mockResolvedValue(createdMember);

      const result = await service.addMember('travel-1', {
        guestName: 'John Doe',
      });

      expect(mockTravelMemberCreate).toHaveBeenCalledWith({
        data: {
          travelId: 'travel-1',
          guestName: 'John Doe',
          role: 'member',
        },
      });
      expect(result.userId).toBeNull();
      expect(result.guestName).toBe('John Doe');
    });

    it('re-throws non-P2002 Prisma errors', async () => {
      const user = { id: 'user-2', email: 'member@test.com', name: 'Member' };
      mockUserFindUnique.mockResolvedValue(user);

      const genericError = new Error('Database connection lost');
      mockTravelMemberCreate.mockRejectedValue(genericError);

      await expect(service.addMember('travel-1', { email: 'member@test.com' })).rejects.toThrow(
        'Database connection lost',
      );
    });
  });

  describe('removeMember', () => {
    it('removes a member successfully', async () => {
      mockTravelMemberFindFirst.mockResolvedValue({
        id: 'member-2',
        travelId: 'travel-1',
        userId: 'user-2',
        role: 'member',
      });
      mockTravelMemberDelete.mockResolvedValue({});

      await service.removeMember('travel-1', 'member-2');

      expect(mockTravelMemberFindFirst).toHaveBeenCalledWith({
        where: { id: 'member-2', travelId: 'travel-1' },
      });
      expect(mockTravelMemberDelete).toHaveBeenCalledWith({
        where: { id: 'member-2' },
      });
    });

    it('throws NotFoundException when member does not exist', async () => {
      mockTravelMemberFindFirst.mockResolvedValue(null);

      await expect(service.removeMember('travel-1', 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws BadRequestException when trying to remove the owner', async () => {
      mockTravelMemberFindFirst.mockResolvedValue({
        id: 'member-1',
        travelId: 'travel-1',
        userId: 'user-1',
        role: 'owner',
      });

      await expect(service.removeMember('travel-1', 'member-1')).rejects.toThrow(
        BadRequestException,
      );

      await expect(service.removeMember('travel-1', 'member-1')).rejects.toThrow(
        'Cannot remove the travel owner',
      );
    });
  });
});
