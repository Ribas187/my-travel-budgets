import { Test } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { DashboardService } from './dashboard.service'
import { PrismaService } from '@/modules/prisma/prisma.service'

const Decimal = Prisma.Decimal

const mockPrisma = {
  travel: { findUnique: jest.fn() },
  expense: { groupBy: jest.fn() },
}

function makeTravelData(overrides: Record<string, unknown> = {}) {
  return {
    id: 'travel-1',
    currency: 'EUR',
    budget: new Decimal('5000.00'),
    members: [
      {
        id: 'member-1',
        userId: 'user-1',
        guestName: null,
        user: { name: 'Alice' },
      },
      {
        id: 'member-2',
        userId: null,
        guestName: 'Bob (guest)',
        user: null,
      },
    ],
    categories: [
      {
        id: 'cat-1',
        name: 'Food',
        icon: '🍔',
        color: '#FF0000',
        budgetLimit: new Decimal('1000.00'),
      },
      {
        id: 'cat-2',
        name: 'Transport',
        icon: '🚗',
        color: '#0000FF',
        budgetLimit: null,
      },
    ],
    ...overrides,
  }
}

describe('DashboardService', () => {
  let service: DashboardService

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile()

    service = module.get(DashboardService)
    jest.clearAllMocks()
  })

  it('returns correct member spending aggregation with multiple members', async () => {
    mockPrisma.travel.findUnique.mockResolvedValue(makeTravelData())
    mockPrisma.expense.groupBy
      .mockResolvedValueOnce([
        { memberId: 'member-1', _sum: { amount: new Decimal('300.00') } },
        { memberId: 'member-2', _sum: { amount: new Decimal('200.00') } },
      ])
      .mockResolvedValueOnce([
        { categoryId: 'cat-1', _sum: { amount: new Decimal('350.00') } },
        { categoryId: 'cat-2', _sum: { amount: new Decimal('150.00') } },
      ])

    const result = await service.getDashboard('travel-1')

    expect(result.memberSpending).toEqual([
      { memberId: 'member-1', displayName: 'Alice', totalSpent: 300 },
      { memberId: 'member-2', displayName: 'Bob (guest)', totalSpent: 200 },
    ])
  })

  it('returns zero-amount entries for members with no expenses', async () => {
    mockPrisma.travel.findUnique.mockResolvedValue(makeTravelData())
    mockPrisma.expense.groupBy
      .mockResolvedValueOnce([
        { memberId: 'member-1', _sum: { amount: new Decimal('500.00') } },
      ])
      .mockResolvedValueOnce([
        { categoryId: 'cat-1', _sum: { amount: new Decimal('500.00') } },
      ])

    const result = await service.getDashboard('travel-1')

    const bob = result.memberSpending.find((m) => m.memberId === 'member-2')
    expect(bob).toEqual({
      memberId: 'member-2',
      displayName: 'Bob (guest)',
      totalSpent: 0,
    })
  })

  it('returns correct category spending with budget limits', async () => {
    mockPrisma.travel.findUnique.mockResolvedValue(makeTravelData())
    mockPrisma.expense.groupBy
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { categoryId: 'cat-1', _sum: { amount: new Decimal('700.00') } },
        { categoryId: 'cat-2', _sum: { amount: new Decimal('150.00') } },
      ])

    const result = await service.getDashboard('travel-1')

    expect(result.categorySpending).toEqual([
      {
        categoryId: 'cat-1',
        name: 'Food',
        icon: '🍔',
        color: '#FF0000',
        totalSpent: 700,
        budgetLimit: 1000,
        status: 'ok',
      },
      {
        categoryId: 'cat-2',
        name: 'Transport',
        icon: '🚗',
        color: '#0000FF',
        totalSpent: 150,
        budgetLimit: null,
        status: 'ok',
      },
    ])
  })

  it('computes ok status when spending < 80% of category limit', async () => {
    mockPrisma.travel.findUnique.mockResolvedValue(makeTravelData())
    mockPrisma.expense.groupBy
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { categoryId: 'cat-1', _sum: { amount: new Decimal('799.00') } },
      ])

    const result = await service.getDashboard('travel-1')

    const food = result.categorySpending.find((c) => c.categoryId === 'cat-1')
    expect(food?.status).toBe('ok')
  })

  it('computes warning status when spending >= 80% and < 100% of category limit', async () => {
    mockPrisma.travel.findUnique.mockResolvedValue(makeTravelData())
    mockPrisma.expense.groupBy
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { categoryId: 'cat-1', _sum: { amount: new Decimal('800.00') } },
      ])

    const result = await service.getDashboard('travel-1')

    const food = result.categorySpending.find((c) => c.categoryId === 'cat-1')
    expect(food?.status).toBe('warning')
  })

  it('computes exceeded status when spending >= 100% of category limit', async () => {
    mockPrisma.travel.findUnique.mockResolvedValue(makeTravelData())
    mockPrisma.expense.groupBy
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { categoryId: 'cat-1', _sum: { amount: new Decimal('1000.00') } },
      ])

    const result = await service.getDashboard('travel-1')

    const food = result.categorySpending.find((c) => c.categoryId === 'cat-1')
    expect(food?.status).toBe('exceeded')
  })

  it('returns ok for categories without a budget limit (null)', async () => {
    mockPrisma.travel.findUnique.mockResolvedValue(makeTravelData())
    mockPrisma.expense.groupBy
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { categoryId: 'cat-2', _sum: { amount: new Decimal('99999.00') } },
      ])

    const result = await service.getDashboard('travel-1')

    const transport = result.categorySpending.find(
      (c) => c.categoryId === 'cat-2',
    )
    expect(transport?.status).toBe('ok')
  })

  it('computes correct overall budget status', async () => {
    mockPrisma.travel.findUnique.mockResolvedValue(makeTravelData())
    mockPrisma.expense.groupBy
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { categoryId: 'cat-1', _sum: { amount: new Decimal('4000.00') } },
        { categoryId: 'cat-2', _sum: { amount: new Decimal('500.00') } },
      ])

    const result = await service.getDashboard('travel-1')

    expect(result.overall).toEqual({
      budget: 5000,
      totalSpent: 4500,
      status: 'warning',
    })
  })

  it('handles travel with no expenses (all zeros)', async () => {
    mockPrisma.travel.findUnique.mockResolvedValue(makeTravelData())
    mockPrisma.expense.groupBy
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])

    const result = await service.getDashboard('travel-1')

    expect(result.overall.totalSpent).toBe(0)
    expect(result.overall.status).toBe('ok')
    result.memberSpending.forEach((m) => expect(m.totalSpent).toBe(0))
    result.categorySpending.forEach((c) => expect(c.totalSpent).toBe(0))
  })

  it('throws NotFoundException for non-existent travel', async () => {
    mockPrisma.travel.findUnique.mockResolvedValue(null)
    mockPrisma.expense.groupBy
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])

    await expect(service.getDashboard('nonexistent')).rejects.toThrow(
      NotFoundException,
    )
  })

  it('uses correct display name (user name for registered, guestName for guests)', async () => {
    mockPrisma.travel.findUnique.mockResolvedValue(makeTravelData())
    mockPrisma.expense.groupBy
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])

    const result = await service.getDashboard('travel-1')

    expect(result.memberSpending[0].displayName).toBe('Alice')
    expect(result.memberSpending[1].displayName).toBe('Bob (guest)')
  })

  it('returns correct currency from the travel', async () => {
    mockPrisma.travel.findUnique.mockResolvedValue(
      makeTravelData({ currency: 'USD' }),
    )
    mockPrisma.expense.groupBy
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])

    const result = await service.getDashboard('travel-1')

    expect(result.currency).toBe('USD')
  })
})
