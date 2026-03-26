import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { ExpensesService } from './expenses.service';

import { EXPENSE_REPOSITORY } from '@/modules/common/database';
import {
  BusinessValidationError,
  EntityNotFoundError,
  ForbiddenError,
} from '@/modules/common/exceptions';

const mockCreate = jest.fn();
const mockFindById = jest.fn();
const mockFindAllPaginated = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockCategoryBelongsToTravel = jest.fn();

const expenseRepositoryMock = {
  create: mockCreate,
  findById: mockFindById,
  findAllPaginated: mockFindAllPaginated,
  update: mockUpdate,
  delete: mockDelete,
  categoryBelongsToTravel: mockCategoryBelongsToTravel,
};

const ownerMember = {
  id: 'member-1',
  travelId: 'travel-1',
  userId: 'user-1',
  role: 'owner',
  guestName: null,
  createdAt: new Date(),
};

const regularMember = {
  id: 'member-2',
  travelId: 'travel-1',
  userId: 'user-2',
  role: 'member',
  guestName: null,
  createdAt: new Date(),
};

const mockExpense = {
  id: 'exp-1',
  travelId: 'travel-1',
  categoryId: 'cat-1',
  memberId: 'member-2',
  amount: 50,
  description: 'Lunch',
  date: new Date('2026-06-02'),
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('ExpensesService', () => {
  let service: ExpensesService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpensesService,
        { provide: EXPENSE_REPOSITORY, useValue: expenseRepositoryMock },
      ],
    }).compile();

    service = module.get<ExpensesService>(ExpensesService);
  });

  describe('create', () => {
    const createDto = {
      categoryId: 'cat-1',
      amount: 50,
      description: 'Lunch',
      date: '2026-06-02',
    };

    it('creates an expense with auto-set memberId', async () => {
      mockCategoryBelongsToTravel.mockResolvedValue(true);
      mockCreate.mockResolvedValue(mockExpense);

      const result = await service.create('travel-1', 'member-2', createDto);

      expect(mockCategoryBelongsToTravel).toHaveBeenCalledWith('cat-1', 'travel-1');
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          travelId: 'travel-1',
          memberId: 'member-2',
          categoryId: 'cat-1',
          amount: 50,
          description: 'Lunch',
        }),
      );
      expect(result).toMatchObject({ id: 'exp-1', amount: 50 });
    });

    it('throws BusinessValidationError when categoryId is not in the travel', async () => {
      mockCategoryBelongsToTravel.mockResolvedValue(false);

      await expect(service.create('travel-1', 'member-2', createDto)).rejects.toThrow(
        BusinessValidationError,
      );
      await expect(service.create('travel-1', 'member-2', createDto)).rejects.toThrow(
        'Category not found in this travel',
      );
    });
  });

  describe('findAll', () => {
    it('returns paginated expenses with default pagination', async () => {
      const paginatedResult = {
        data: [mockExpense],
        meta: { page: 1, limit: 20, total: 3, totalPages: 1 },
      };
      mockFindAllPaginated.mockResolvedValue(paginatedResult);

      const result = await service.findAll('travel-1', {});

      expect(mockFindAllPaginated).toHaveBeenCalledWith('travel-1', {}, { page: 1, limit: 20 });
      expect(result.meta).toEqual({ page: 1, limit: 20, total: 3, totalPages: 1 });
      expect(result.data).toHaveLength(1);
    });

    it('filters by categoryId', async () => {
      const paginatedResult = {
        data: [mockExpense],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      };
      mockFindAllPaginated.mockResolvedValue(paginatedResult);

      await service.findAll('travel-1', { categoryId: 'cat-1' });

      expect(mockFindAllPaginated).toHaveBeenCalledWith(
        'travel-1',
        { categoryId: 'cat-1' },
        { page: 1, limit: 20 },
      );
    });

    it('filters by memberId', async () => {
      const paginatedResult = {
        data: [mockExpense],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      };
      mockFindAllPaginated.mockResolvedValue(paginatedResult);

      await service.findAll('travel-1', { memberId: 'member-2' });

      expect(mockFindAllPaginated).toHaveBeenCalledWith(
        'travel-1',
        { memberId: 'member-2' },
        { page: 1, limit: 20 },
      );
    });

    it('filters by date range', async () => {
      const paginatedResult = {
        data: [mockExpense],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      };
      mockFindAllPaginated.mockResolvedValue(paginatedResult);

      await service.findAll('travel-1', {
        startDate: '2026-06-01',
        endDate: '2026-06-15',
      });

      expect(mockFindAllPaginated).toHaveBeenCalledWith(
        'travel-1',
        { startDate: '2026-06-01', endDate: '2026-06-15' },
        { page: 1, limit: 20 },
      );
    });

    it('calculates pagination math correctly', async () => {
      const paginatedResult = {
        data: [],
        meta: { page: 2, limit: 10, total: 25, totalPages: 3 },
      };
      mockFindAllPaginated.mockResolvedValue(paginatedResult);

      const result = await service.findAll('travel-1', { page: 2, limit: 10 });

      expect(mockFindAllPaginated).toHaveBeenCalledWith(
        'travel-1',
        { page: 2, limit: 10 },
        { page: 2, limit: 10 },
      );
      expect(result.meta).toEqual({ page: 2, limit: 10, total: 25, totalPages: 3 });
    });

    it('computes totalPages correctly for partial last page', async () => {
      const paginatedResult = {
        data: [],
        meta: { page: 1, limit: 20, total: 21, totalPages: 2 },
      };
      mockFindAllPaginated.mockResolvedValue(paginatedResult);

      const result = await service.findAll('travel-1', { page: 1, limit: 20 });

      expect(result.meta.totalPages).toBe(2);
    });
  });

  describe('update', () => {
    const updateDto = { description: 'Updated lunch' };

    it('updates own expense successfully', async () => {
      mockFindById.mockResolvedValue(mockExpense);
      const updated = { ...mockExpense, description: 'Updated lunch' };
      mockUpdate.mockResolvedValue(updated);

      const result = await service.update('exp-1', regularMember, updateDto);

      expect(result).toMatchObject({ description: 'Updated lunch' });
      expect(mockUpdate).toHaveBeenCalledWith('exp-1', { description: 'Updated lunch' });
    });

    it("allows owner to update another member's expense (owner override)", async () => {
      mockFindById.mockResolvedValue(mockExpense); // memberId: 'member-2'
      const updated = { ...mockExpense, description: 'Owner corrected' };
      mockUpdate.mockResolvedValue(updated);

      // ownerMember.id is 'member-1', expense.memberId is 'member-2' — but role is 'owner'
      const result = await service.update('exp-1', ownerMember, { description: 'Owner corrected' });

      expect(result).toMatchObject({ description: 'Owner corrected' });
    });

    it("throws ForbiddenError when non-owner tries to update another member's expense", async () => {
      const otherMember = { ...regularMember, id: 'member-3' };
      mockFindById.mockResolvedValue(mockExpense); // memberId: 'member-2'

      await expect(service.update('exp-1', otherMember, updateDto)).rejects.toThrow(
        ForbiddenError,
      );
      await expect(service.update('exp-1', otherMember, updateDto)).rejects.toThrow(
        'You can only edit your own expenses',
      );
    });

    it('throws EntityNotFoundError when expense does not exist', async () => {
      mockFindById.mockResolvedValue(null);

      await expect(service.update('non-existent', regularMember, updateDto)).rejects.toThrow(
        EntityNotFoundError,
      );
    });

    it('throws BusinessValidationError when updating to an invalid categoryId', async () => {
      mockFindById.mockResolvedValue(mockExpense);
      mockCategoryBelongsToTravel.mockResolvedValue(false);

      await expect(
        service.update('exp-1', regularMember, { categoryId: 'invalid-cat' }),
      ).rejects.toThrow(BusinessValidationError);
      await expect(
        service.update('exp-1', regularMember, { categoryId: 'invalid-cat' }),
      ).rejects.toThrow('Category not found in this travel');
    });
  });

  describe('remove', () => {
    it('deletes own expense successfully', async () => {
      mockFindById.mockResolvedValue(mockExpense);
      mockDelete.mockResolvedValue(undefined);

      await service.remove('exp-1', regularMember);

      expect(mockDelete).toHaveBeenCalledWith('exp-1');
    });

    it("allows owner to delete another member's expense (owner override)", async () => {
      mockFindById.mockResolvedValue(mockExpense); // memberId: 'member-2'
      mockDelete.mockResolvedValue(undefined);

      // ownerMember.id is 'member-1', expense.memberId is 'member-2' — but role is 'owner'
      await service.remove('exp-1', ownerMember);

      expect(mockDelete).toHaveBeenCalledWith('exp-1');
    });

    it("throws ForbiddenError when non-owner tries to delete another member's expense", async () => {
      const otherMember = { ...regularMember, id: 'member-3' };
      mockFindById.mockResolvedValue(mockExpense); // memberId: 'member-2'

      await expect(service.remove('exp-1', otherMember)).rejects.toThrow(ForbiddenError);
      await expect(service.remove('exp-1', otherMember)).rejects.toThrow(
        'You can only delete your own expenses',
      );
    });

    it('throws EntityNotFoundError when expense does not exist', async () => {
      mockFindById.mockResolvedValue(null);

      await expect(service.remove('non-existent', regularMember)).rejects.toThrow(
        EntityNotFoundError,
      );
    });
  });
});
