import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { CategoriesService } from './categories.service';

import { CATEGORY_REPOSITORY } from '@/modules/common/database';
import { ConflictError, EntityNotFoundError } from '@/modules/common/exceptions';

const mockFindByTravelAndName = jest.fn();
const mockFindByIdAndTravel = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockCountExpensesByCategory = jest.fn();

const categoryRepositoryMock = {
  findByTravelAndName: mockFindByTravelAndName,
  findByIdAndTravel: mockFindByIdAndTravel,
  create: mockCreate,
  update: mockUpdate,
  delete: mockDelete,
  countExpensesByCategory: mockCountExpensesByCategory,
};

describe('CategoriesService', () => {
  let service: CategoriesService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: CATEGORY_REPOSITORY, useValue: categoryRepositoryMock },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  describe('create', () => {
    const createDto = { name: 'Food', icon: 'utensils', color: '#FF0000' };

    it('creates a category successfully', async () => {
      mockFindByTravelAndName.mockResolvedValue(null);
      const created = { id: 'cat-1', travelId: 'travel-1', ...createDto, budgetLimit: null };
      mockCreate.mockResolvedValue(created);

      const result = await service.create('travel-1', createDto);

      expect(mockFindByTravelAndName).toHaveBeenCalledWith('travel-1', 'Food');
      expect(mockCreate).toHaveBeenCalledWith({
        travelId: 'travel-1',
        name: 'Food',
        icon: 'utensils',
        color: '#FF0000',
        budgetLimit: null,
      });
      expect(result).toEqual(created);
    });

    it('creates a category with budgetLimit', async () => {
      mockFindByTravelAndName.mockResolvedValue(null);
      const dto = { ...createDto, budgetLimit: 500 };
      const created = { id: 'cat-1', travelId: 'travel-1', ...dto };
      mockCreate.mockResolvedValue(created);

      await service.create('travel-1', dto);

      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ budgetLimit: 500 }));
    });

    it('throws ConflictError when category name already exists in travel', async () => {
      mockFindByTravelAndName.mockResolvedValue({ id: 'existing-cat', name: 'Food' });

      await expect(service.create('travel-1', createDto)).rejects.toThrow(ConflictError);
      await expect(service.create('travel-1', createDto)).rejects.toThrow(
        'A category with this name already exists in this travel',
      );
    });

    it('does not check uniqueness across different travels', async () => {
      mockFindByTravelAndName.mockResolvedValue(null);
      const created = { id: 'cat-2', travelId: 'travel-2', ...createDto, budgetLimit: null };
      mockCreate.mockResolvedValue(created);

      const result = await service.create('travel-2', createDto);

      expect(mockFindByTravelAndName).toHaveBeenCalledWith('travel-2', 'Food');
      expect(result).toEqual(created);
    });
  });

  describe('update', () => {
    const existing = {
      id: 'cat-1',
      travelId: 'travel-1',
      name: 'Food',
      icon: 'utensils',
      color: '#FF0000',
      budgetLimit: null,
    };

    it('updates a category successfully', async () => {
      mockFindByIdAndTravel.mockResolvedValueOnce(existing);
      const updated = { ...existing, name: 'Dining' };
      mockUpdate.mockResolvedValue(updated);

      const result = await service.update('travel-1', 'cat-1', { name: 'Dining' });

      expect(mockUpdate).toHaveBeenCalledWith('cat-1', { name: 'Dining' });
      expect(result).toEqual(updated);
    });

    it('throws EntityNotFoundError when category does not exist', async () => {
      mockFindByIdAndTravel.mockResolvedValue(null);

      await expect(
        service.update('travel-1', 'non-existent', { name: 'Dining' }),
      ).rejects.toThrow(EntityNotFoundError);
    });

    it('throws ConflictError when updating name to an existing name', async () => {
      mockFindByIdAndTravel.mockResolvedValueOnce(existing);
      mockFindByTravelAndName.mockResolvedValueOnce({ id: 'cat-2', name: 'Dining' });

      await expect(service.update('travel-1', 'cat-1', { name: 'Dining' })).rejects.toThrow(
        ConflictError,
      );
    });

    it('allows updating other fields without name conflict check', async () => {
      mockFindByIdAndTravel.mockResolvedValueOnce(existing);
      const updated = { ...existing, color: '#00FF00' };
      mockUpdate.mockResolvedValue(updated);

      await service.update('travel-1', 'cat-1', { color: '#00FF00' });

      // findByTravelAndName not called (no name change)
      expect(mockFindByTravelAndName).not.toHaveBeenCalled();
    });

    it('allows updating to the same name (no conflict)', async () => {
      mockFindByIdAndTravel.mockResolvedValueOnce(existing);
      const updated = { ...existing };
      mockUpdate.mockResolvedValue(updated);

      await service.update('travel-1', 'cat-1', { name: 'Food' });

      // No findByTravelAndName call since name hasn't changed
      expect(mockFindByTravelAndName).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    const existing = {
      id: 'cat-1',
      travelId: 'travel-1',
      name: 'Food',
    };

    it('throws EntityNotFoundError when category does not exist', async () => {
      mockFindByIdAndTravel.mockResolvedValue(null);

      await expect(service.remove('travel-1', 'non-existent')).rejects.toThrow(
        EntityNotFoundError,
      );
    });

    it('throws ConflictError when category has expenses', async () => {
      mockFindByIdAndTravel.mockResolvedValue(existing);
      mockCountExpensesByCategory.mockResolvedValue(3);

      await expect(service.remove('travel-1', 'cat-1')).rejects.toThrow(ConflictError);
      await expect(service.remove('travel-1', 'cat-1')).rejects.toThrow(
        'Cannot delete this category because it has associated expenses',
      );
    });

    it('deletes category when it has no expenses', async () => {
      mockFindByIdAndTravel.mockResolvedValue(existing);
      mockCountExpensesByCategory.mockResolvedValue(0);
      mockDelete.mockResolvedValue(undefined);

      await service.remove('travel-1', 'cat-1');

      expect(mockDelete).toHaveBeenCalledWith('cat-1');
    });
  });
});
