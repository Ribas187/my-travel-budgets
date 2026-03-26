import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { TravelsService } from './travels.service';

import { TRAVEL_REPOSITORY } from '@/modules/common/database';
import { EntityNotFoundError } from '@/modules/common/exceptions';

const mockCreateWithOwner = jest.fn();
const mockFindAllByUser = jest.fn();
const mockFindOneWithDetails = jest.fn();
const mockGetTotalSpent = jest.fn();
const mockUpdate = jest.fn();
const mockRemove = jest.fn();

const travelRepositoryMock = {
  createWithOwner: mockCreateWithOwner,
  findAllByUser: mockFindAllByUser,
  findOneWithDetails: mockFindOneWithDetails,
  getTotalSpent: mockGetTotalSpent,
  update: mockUpdate,
  remove: mockRemove,
};

describe('TravelsService', () => {
  let service: TravelsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TravelsService,
        { provide: TRAVEL_REPOSITORY, useValue: travelRepositoryMock },
      ],
    }).compile();

    service = module.get<TravelsService>(TravelsService);
  });

  describe('createTravel', () => {
    it('creates a travel and owner member via the repository', async () => {
      const dto = {
        name: 'Trip to Paris',
        currency: 'EUR',
        budget: 5000,
        startDate: '2026-06-01',
        endDate: '2026-06-15',
        description: 'Summer trip',
      };

      const createdTravel = {
        id: 'travel-1',
        ...dto,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        createdById: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCreateWithOwner.mockResolvedValue(createdTravel);

      const result = await service.createTravel('user-1', dto);

      expect(result).toEqual(createdTravel);
      expect(mockCreateWithOwner).toHaveBeenCalledWith('user-1', dto);
    });
  });

  describe('findAllByUser', () => {
    it('returns travels where user is a member, ordered by startDate desc', async () => {
      const travels = [
        { id: 'travel-1', name: 'Trip A', startDate: new Date('2026-07-01') },
        { id: 'travel-2', name: 'Trip B', startDate: new Date('2026-06-01') },
      ];
      mockFindAllByUser.mockResolvedValue(travels);

      const result = await service.findAllByUser('user-1');

      expect(mockFindAllByUser).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(travels);
    });
  });

  describe('findOne', () => {
    it('returns travel with members and spending summary', async () => {
      const travel = {
        id: 'travel-1',
        name: 'Trip to Paris',
        budget: 5000,
        members: [
          {
            id: 'member-1',
            userId: 'user-1',
            role: 'owner',
            user: { id: 'user-1', email: 'owner@test.com', name: 'Owner', avatarUrl: null },
          },
        ],
        categories: [
          {
            id: 'cat-1',
            name: 'Food',
            icon: '🍔',
            color: '#F59E0B',
            budgetLimit: 500,
            createdAt: new Date(),
          },
        ],
      };
      mockFindOneWithDetails.mockResolvedValue(travel);
      mockGetTotalSpent.mockResolvedValue(1500);

      const result = await service.findOne('travel-1');

      expect(mockFindOneWithDetails).toHaveBeenCalledWith('travel-1');
      expect(mockGetTotalSpent).toHaveBeenCalledWith('travel-1');
      expect(result.summary).toEqual({
        totalSpent: 1500,
        budget: 5000,
        remaining: 3500,
      });
      expect(result.categories).toEqual([
        expect.objectContaining({ id: 'cat-1', name: 'Food', budgetLimit: 500 }),
      ]);
    });

    it('returns zero totalSpent when no expenses exist', async () => {
      const travel = {
        id: 'travel-1',
        name: 'Trip',
        budget: 3000,
        members: [],
        categories: [],
      };
      mockFindOneWithDetails.mockResolvedValue(travel);
      mockGetTotalSpent.mockResolvedValue(0);

      const result = await service.findOne('travel-1');

      expect(result.summary).toEqual({
        totalSpent: 0,
        budget: 3000,
        remaining: 3000,
      });
    });

    it('throws EntityNotFoundError when travel does not exist', async () => {
      mockFindOneWithDetails.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(EntityNotFoundError);
    });
  });

  describe('update', () => {
    it('updates only provided fields', async () => {
      const updated = {
        id: 'travel-1',
        name: 'Updated Trip',
        budget: 6000,
      };
      mockUpdate.mockResolvedValue(updated);

      const result = await service.update('travel-1', {
        name: 'Updated Trip',
        budget: 6000,
      });

      expect(mockUpdate).toHaveBeenCalledWith('travel-1', { name: 'Updated Trip', budget: 6000 });
      expect(result).toEqual(updated);
    });

    it('converts date strings to Date objects', async () => {
      mockUpdate.mockResolvedValue({});

      await service.update('travel-1', {
        startDate: '2026-07-01',
        endDate: '2026-07-15',
      });

      expect(mockUpdate).toHaveBeenCalledWith('travel-1', {
        startDate: new Date('2026-07-01'),
        endDate: new Date('2026-07-15'),
      });
    });
  });

  describe('remove', () => {
    it('deletes the travel', async () => {
      mockRemove.mockResolvedValue(undefined);

      await service.remove('travel-1');

      expect(mockRemove).toHaveBeenCalledWith('travel-1');
    });
  });
});
