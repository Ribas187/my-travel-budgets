import { ConflictException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '@/modules/prisma/prisma.service'
import { CategoriesService } from './categories.service'

const mockCategoryFindFirst = jest.fn()
const mockCategoryCreate = jest.fn()
const mockCategoryUpdate = jest.fn()
const mockCategoryDelete = jest.fn()
const mockExpenseCount = jest.fn()

const prismaServiceMock = {
  category: {
    findFirst: mockCategoryFindFirst,
    create: mockCategoryCreate,
    update: mockCategoryUpdate,
    delete: mockCategoryDelete,
  },
  expense: {
    count: mockExpenseCount,
  },
}

describe('CategoriesService', () => {
  let service: CategoriesService

  beforeEach(async () => {
    jest.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: prismaServiceMock },
      ],
    }).compile()

    service = module.get<CategoriesService>(CategoriesService)
  })

  describe('create', () => {
    const createDto = { name: 'Food', icon: 'utensils', color: '#FF0000' }

    it('creates a category successfully', async () => {
      mockCategoryFindFirst.mockResolvedValue(null)
      const created = { id: 'cat-1', travelId: 'travel-1', ...createDto, budgetLimit: null }
      mockCategoryCreate.mockResolvedValue(created)

      const result = await service.create('travel-1', createDto)

      expect(mockCategoryFindFirst).toHaveBeenCalledWith({
        where: { travelId: 'travel-1', name: 'Food' },
      })
      expect(mockCategoryCreate).toHaveBeenCalledWith({
        data: {
          travelId: 'travel-1',
          name: 'Food',
          icon: 'utensils',
          color: '#FF0000',
          budgetLimit: null,
        },
      })
      expect(result).toEqual(created)
    })

    it('creates a category with budgetLimit', async () => {
      mockCategoryFindFirst.mockResolvedValue(null)
      const dto = { ...createDto, budgetLimit: 500 }
      const created = { id: 'cat-1', travelId: 'travel-1', ...dto }
      mockCategoryCreate.mockResolvedValue(created)

      await service.create('travel-1', dto)

      expect(mockCategoryCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({ budgetLimit: 500 }),
      })
    })

    it('throws ConflictException when category name already exists in travel', async () => {
      mockCategoryFindFirst.mockResolvedValue({ id: 'existing-cat', name: 'Food' })

      await expect(service.create('travel-1', createDto)).rejects.toThrow(
        ConflictException,
      )
      await expect(service.create('travel-1', createDto)).rejects.toThrow(
        'A category with this name already exists in this travel',
      )
    })

    it('does not check uniqueness across different travels', async () => {
      mockCategoryFindFirst.mockResolvedValue(null)
      const created = { id: 'cat-2', travelId: 'travel-2', ...createDto, budgetLimit: null }
      mockCategoryCreate.mockResolvedValue(created)

      const result = await service.create('travel-2', createDto)

      expect(mockCategoryFindFirst).toHaveBeenCalledWith({
        where: { travelId: 'travel-2', name: 'Food' },
      })
      expect(result).toEqual(created)
    })
  })

  describe('update', () => {
    const existing = {
      id: 'cat-1',
      travelId: 'travel-1',
      name: 'Food',
      icon: 'utensils',
      color: '#FF0000',
      budgetLimit: null,
    }

    it('updates a category successfully', async () => {
      mockCategoryFindFirst.mockResolvedValueOnce(existing)
      const updated = { ...existing, name: 'Dining' }
      mockCategoryUpdate.mockResolvedValue(updated)

      const result = await service.update('travel-1', 'cat-1', { name: 'Dining' })

      expect(mockCategoryUpdate).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        data: { name: 'Dining' },
      })
      expect(result).toEqual(updated)
    })

    it('throws NotFoundException when category does not exist', async () => {
      mockCategoryFindFirst.mockResolvedValue(null)

      await expect(
        service.update('travel-1', 'non-existent', { name: 'Dining' }),
      ).rejects.toThrow(NotFoundException)
    })

    it('throws ConflictException when updating name to an existing name', async () => {
      mockCategoryFindFirst
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce({ id: 'cat-2', name: 'Dining' })

      await expect(
        service.update('travel-1', 'cat-1', { name: 'Dining' }),
      ).rejects.toThrow(ConflictException)
    })

    it('allows updating other fields without name conflict check', async () => {
      mockCategoryFindFirst.mockResolvedValueOnce(existing)
      const updated = { ...existing, color: '#00FF00' }
      mockCategoryUpdate.mockResolvedValue(updated)

      await service.update('travel-1', 'cat-1', { color: '#00FF00' })

      // findFirst called only once (for category lookup, no name check)
      expect(mockCategoryFindFirst).toHaveBeenCalledTimes(1)
    })

    it('allows updating to the same name (no conflict)', async () => {
      mockCategoryFindFirst.mockResolvedValueOnce(existing)
      const updated = { ...existing }
      mockCategoryUpdate.mockResolvedValue(updated)

      await service.update('travel-1', 'cat-1', { name: 'Food' })

      // No second findFirst call since name hasn't changed
      expect(mockCategoryFindFirst).toHaveBeenCalledTimes(1)
    })
  })

  describe('remove', () => {
    const existing = {
      id: 'cat-1',
      travelId: 'travel-1',
      name: 'Food',
    }

    it('throws NotFoundException when category does not exist', async () => {
      mockCategoryFindFirst.mockResolvedValue(null)

      await expect(service.remove('travel-1', 'non-existent')).rejects.toThrow(
        NotFoundException,
      )
    })

    it('throws ConflictException when category has expenses', async () => {
      mockCategoryFindFirst.mockResolvedValue(existing)
      mockExpenseCount.mockResolvedValue(3)

      await expect(service.remove('travel-1', 'cat-1')).rejects.toThrow(
        ConflictException,
      )
      await expect(service.remove('travel-1', 'cat-1')).rejects.toThrow(
        'Cannot delete this category because it has associated expenses',
      )
    })

    it('deletes category when it has no expenses', async () => {
      mockCategoryFindFirst.mockResolvedValue(existing)
      mockExpenseCount.mockResolvedValue(0)
      mockCategoryDelete.mockResolvedValue(existing)

      await service.remove('travel-1', 'cat-1')

      expect(mockCategoryDelete).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
      })
    })
  })
})
