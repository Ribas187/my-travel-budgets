import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '@/modules/prisma/prisma.service'
import { ExpensesService } from './expenses.service'

const mockCategoryFindFirst = jest.fn()
const mockExpenseFindUnique = jest.fn()
const mockExpenseCreate = jest.fn()
const mockExpenseFindMany = jest.fn()
const mockExpenseCount = jest.fn()
const mockExpenseUpdate = jest.fn()
const mockExpenseDelete = jest.fn()

const prismaServiceMock = {
  category: {
    findFirst: mockCategoryFindFirst,
  },
  expense: {
    findUnique: mockExpenseFindUnique,
    create: mockExpenseCreate,
    findMany: mockExpenseFindMany,
    count: mockExpenseCount,
    update: mockExpenseUpdate,
    delete: mockExpenseDelete,
  },
}

const ownerMember = {
  id: 'member-1',
  travelId: 'travel-1',
  userId: 'user-1',
  role: 'owner',
  guestName: null,
  createdAt: new Date(),
}

const regularMember = {
  id: 'member-2',
  travelId: 'travel-1',
  userId: 'user-2',
  role: 'member',
  guestName: null,
  createdAt: new Date(),
}

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
}

describe('ExpensesService', () => {
  let service: ExpensesService

  beforeEach(async () => {
    jest.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpensesService,
        { provide: PrismaService, useValue: prismaServiceMock },
      ],
    }).compile()

    service = module.get<ExpensesService>(ExpensesService)
  })

  describe('create', () => {
    const createDto = {
      categoryId: 'cat-1',
      amount: 50,
      description: 'Lunch',
      date: '2026-06-02',
    }

    it('creates an expense with auto-set memberId', async () => {
      mockCategoryFindFirst.mockResolvedValue({ id: 'cat-1', travelId: 'travel-1' })
      mockExpenseCreate.mockResolvedValue(mockExpense)

      const result = await service.create('travel-1', 'member-2', createDto)

      expect(mockCategoryFindFirst).toHaveBeenCalledWith({
        where: { id: 'cat-1', travelId: 'travel-1' },
      })
      expect(mockExpenseCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          travelId: 'travel-1',
          memberId: 'member-2',
          categoryId: 'cat-1',
          amount: 50,
          description: 'Lunch',
        }),
      })
      expect(result).toMatchObject({ id: 'exp-1', amount: 50 })
    })

    it('throws BadRequestException when categoryId is not in the travel (400)', async () => {
      mockCategoryFindFirst.mockResolvedValue(null)

      await expect(service.create('travel-1', 'member-2', createDto)).rejects.toThrow(
        BadRequestException,
      )
      await expect(service.create('travel-1', 'member-2', createDto)).rejects.toThrow(
        'Category not found in this travel',
      )
    })
  })

  describe('findAll', () => {
    it('returns paginated expenses with default pagination', async () => {
      mockExpenseCount.mockResolvedValue(3)
      mockExpenseFindMany.mockResolvedValue([mockExpense])

      const result = await service.findAll('travel-1', {})

      expect(mockExpenseFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { travelId: 'travel-1' },
          orderBy: { date: 'desc' },
          skip: 0,
          take: 20,
        }),
      )
      expect(result.meta).toEqual({ page: 1, limit: 20, total: 3, totalPages: 1 })
      expect(result.data).toHaveLength(1)
    })

    it('filters by categoryId', async () => {
      mockExpenseCount.mockResolvedValue(1)
      mockExpenseFindMany.mockResolvedValue([mockExpense])

      await service.findAll('travel-1', { categoryId: 'cat-1' })

      expect(mockExpenseFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ travelId: 'travel-1', categoryId: 'cat-1' }),
        }),
      )
    })

    it('filters by memberId', async () => {
      mockExpenseCount.mockResolvedValue(1)
      mockExpenseFindMany.mockResolvedValue([mockExpense])

      await service.findAll('travel-1', { memberId: 'member-2' })

      expect(mockExpenseFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ memberId: 'member-2' }),
        }),
      )
    })

    it('filters by date range', async () => {
      mockExpenseCount.mockResolvedValue(1)
      mockExpenseFindMany.mockResolvedValue([mockExpense])

      await service.findAll('travel-1', {
        startDate: '2026-06-01',
        endDate: '2026-06-15',
      })

      expect(mockExpenseFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: {
              gte: new Date('2026-06-01'),
              lte: new Date('2026-06-15'),
            },
          }),
        }),
      )
    })

    it('calculates pagination math correctly', async () => {
      mockExpenseCount.mockResolvedValue(25)
      mockExpenseFindMany.mockResolvedValue([])

      const result = await service.findAll('travel-1', { page: 2, limit: 10 })

      expect(mockExpenseFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      )
      expect(result.meta).toEqual({ page: 2, limit: 10, total: 25, totalPages: 3 })
    })

    it('computes totalPages correctly for partial last page', async () => {
      mockExpenseCount.mockResolvedValue(21)
      mockExpenseFindMany.mockResolvedValue([])

      const result = await service.findAll('travel-1', { page: 1, limit: 20 })

      expect(result.meta.totalPages).toBe(2)
    })
  })

  describe('update', () => {
    const updateDto = { description: 'Updated lunch' }

    it('updates own expense successfully', async () => {
      mockExpenseFindUnique.mockResolvedValue(mockExpense)
      const updated = { ...mockExpense, description: 'Updated lunch' }
      mockExpenseUpdate.mockResolvedValue(updated)

      const result = await service.update('exp-1', regularMember, updateDto)

      expect(result).toMatchObject({ description: 'Updated lunch' })
      expect(mockExpenseUpdate).toHaveBeenCalledWith({
        where: { id: 'exp-1' },
        data: { description: 'Updated lunch' },
      })
    })

    it('allows owner to update another member\'s expense (owner override)', async () => {
      mockExpenseFindUnique.mockResolvedValue(mockExpense) // memberId: 'member-2'
      const updated = { ...mockExpense, description: 'Owner corrected' }
      mockExpenseUpdate.mockResolvedValue(updated)

      // ownerMember.id is 'member-1', expense.memberId is 'member-2' — but role is 'owner'
      const result = await service.update('exp-1', ownerMember, { description: 'Owner corrected' })

      expect(result).toMatchObject({ description: 'Owner corrected' })
    })

    it('throws ForbiddenException when non-owner tries to update another member\'s expense (403)', async () => {
      const otherMember = { ...regularMember, id: 'member-3' }
      mockExpenseFindUnique.mockResolvedValue(mockExpense) // memberId: 'member-2'

      await expect(service.update('exp-1', otherMember, updateDto)).rejects.toThrow(
        ForbiddenException,
      )
      await expect(service.update('exp-1', otherMember, updateDto)).rejects.toThrow(
        'You can only edit your own expenses',
      )
    })

    it('throws NotFoundException when expense does not exist', async () => {
      mockExpenseFindUnique.mockResolvedValue(null)

      await expect(service.update('non-existent', regularMember, updateDto)).rejects.toThrow(
        NotFoundException,
      )
    })

    it('throws BadRequestException when updating to an invalid categoryId (400)', async () => {
      mockExpenseFindUnique.mockResolvedValue(mockExpense)
      mockCategoryFindFirst.mockResolvedValue(null)

      await expect(
        service.update('exp-1', regularMember, { categoryId: 'invalid-cat' }),
      ).rejects.toThrow(BadRequestException)
      await expect(
        service.update('exp-1', regularMember, { categoryId: 'invalid-cat' }),
      ).rejects.toThrow('Category not found in this travel')
    })
  })

  describe('remove', () => {
    it('deletes own expense successfully', async () => {
      mockExpenseFindUnique.mockResolvedValue(mockExpense)
      mockExpenseDelete.mockResolvedValue(mockExpense)

      await service.remove('exp-1', regularMember)

      expect(mockExpenseDelete).toHaveBeenCalledWith({ where: { id: 'exp-1' } })
    })

    it('allows owner to delete another member\'s expense (owner override)', async () => {
      mockExpenseFindUnique.mockResolvedValue(mockExpense) // memberId: 'member-2'
      mockExpenseDelete.mockResolvedValue(mockExpense)

      // ownerMember.id is 'member-1', expense.memberId is 'member-2' — but role is 'owner'
      await service.remove('exp-1', ownerMember)

      expect(mockExpenseDelete).toHaveBeenCalledWith({ where: { id: 'exp-1' } })
    })

    it('throws ForbiddenException when non-owner tries to delete another member\'s expense (403)', async () => {
      const otherMember = { ...regularMember, id: 'member-3' }
      mockExpenseFindUnique.mockResolvedValue(mockExpense) // memberId: 'member-2'

      await expect(service.remove('exp-1', otherMember)).rejects.toThrow(ForbiddenException)
      await expect(service.remove('exp-1', otherMember)).rejects.toThrow(
        'You can only delete your own expenses',
      )
    })

    it('throws NotFoundException when expense does not exist', async () => {
      mockExpenseFindUnique.mockResolvedValue(null)

      await expect(service.remove('non-existent', regularMember)).rejects.toThrow(NotFoundException)
    })
  })
})
