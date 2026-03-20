import { NotFoundException } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { TravelsService } from './travels.service';

import { PrismaService } from '@/modules/prisma/prisma.service';

const mockTravelCreate = jest.fn();
const mockTravelMemberCreate = jest.fn();
const mockTravelFindMany = jest.fn();
const mockTravelFindUnique = jest.fn();
const mockTravelUpdate = jest.fn();
const mockTravelDelete = jest.fn();
const mockExpenseAggregate = jest.fn();
const mockTransaction = jest.fn();

const prismaServiceMock = {
  travel: {
    create: mockTravelCreate,
    findMany: mockTravelFindMany,
    findUnique: mockTravelFindUnique,
    update: mockTravelUpdate,
    delete: mockTravelDelete,
  },
  travelMember: {
    create: mockTravelMemberCreate,
  },
  expense: {
    aggregate: mockExpenseAggregate,
  },
  $transaction: mockTransaction,
};

describe('TravelsService', () => {
  let service: TravelsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [TravelsService, { provide: PrismaService, useValue: prismaServiceMock }],
    }).compile();

    service = module.get<TravelsService>(TravelsService);
  });

  describe('createTravel', () => {
    it('creates a travel and owner member in a transaction', async () => {
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

      mockTransaction.mockImplementation(
        async (fn: (tx: typeof prismaServiceMock) => Promise<unknown>) => {
          const txMock = {
            travel: { create: jest.fn().mockResolvedValue(createdTravel) },
            travelMember: { create: jest.fn().mockResolvedValue({ id: 'member-1' }) },
          };
          return fn(txMock as unknown as typeof prismaServiceMock);
        },
      );

      const result = await service.createTravel('user-1', dto);

      expect(result).toEqual(createdTravel);
      expect(mockTransaction).toHaveBeenCalled();
    });
  });

  describe('findAllByUser', () => {
    it('returns travels where user is a member, ordered by startDate desc', async () => {
      const travels = [
        { id: 'travel-1', name: 'Trip A', startDate: new Date('2026-07-01') },
        { id: 'travel-2', name: 'Trip B', startDate: new Date('2026-06-01') },
      ];
      mockTravelFindMany.mockResolvedValue(travels);

      const result = await service.findAllByUser('user-1');

      expect(mockTravelFindMany).toHaveBeenCalledWith({
        where: {
          members: {
            some: { userId: 'user-1' },
          },
        },
        orderBy: { startDate: 'desc' },
      });
      expect(result).toEqual(travels);
    });
  });

  describe('findOne', () => {
    it('returns travel with members and spending summary', async () => {
      const travel = {
        id: 'travel-1',
        name: 'Trip to Paris',
        budget: { toNumber: () => 5000 },
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
            budgetLimit: { toNumber: () => 500 },
            createdAt: new Date(),
          },
        ],
      };
      mockTravelFindUnique.mockResolvedValue(travel);
      mockExpenseAggregate.mockResolvedValue({
        _sum: { amount: { toNumber: () => 1500 } },
      });

      const result = await service.findOne('travel-1');

      expect(mockTravelFindUnique).toHaveBeenCalledWith({
        where: { id: 'travel-1' },
        include: {
          members: {
            include: {
              user: {
                select: { id: true, email: true, name: true, avatarUrl: true },
              },
            },
          },
          categories: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });
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
        budget: { toNumber: () => 3000 },
        members: [],
        categories: [],
      };
      mockTravelFindUnique.mockResolvedValue(travel);
      mockExpenseAggregate.mockResolvedValue({
        _sum: { amount: null },
      });

      const result = await service.findOne('travel-1');

      expect(result.summary).toEqual({
        totalSpent: 0,
        budget: 3000,
        remaining: 3000,
      });
    });

    it('throws NotFoundException when travel does not exist', async () => {
      mockTravelFindUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates only provided fields', async () => {
      const updated = {
        id: 'travel-1',
        name: 'Updated Trip',
        budget: 6000,
      };
      mockTravelUpdate.mockResolvedValue(updated);

      const result = await service.update('travel-1', {
        name: 'Updated Trip',
        budget: 6000,
      });

      expect(mockTravelUpdate).toHaveBeenCalledWith({
        where: { id: 'travel-1' },
        data: { name: 'Updated Trip', budget: 6000 },
      });
      expect(result).toEqual(updated);
    });

    it('converts date strings to Date objects', async () => {
      mockTravelUpdate.mockResolvedValue({});

      await service.update('travel-1', {
        startDate: '2026-07-01',
        endDate: '2026-07-15',
      });

      expect(mockTravelUpdate).toHaveBeenCalledWith({
        where: { id: 'travel-1' },
        data: {
          startDate: new Date('2026-07-01'),
          endDate: new Date('2026-07-15'),
        },
      });
    });
  });

  describe('remove', () => {
    it('deletes the travel', async () => {
      mockTravelDelete.mockResolvedValue({});

      await service.remove('travel-1');

      expect(mockTravelDelete).toHaveBeenCalledWith({
        where: { id: 'travel-1' },
      });
    });
  });
});
