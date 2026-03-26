import { Test } from '@nestjs/testing';

import { DashboardService } from './dashboard.service';
import type { IDashboardRepository } from './repository/dashboard.repository.interface';

import { DASHBOARD_REPOSITORY } from '@/modules/common/database';
import { EntityNotFoundError } from '@/modules/common/exceptions';

const mockRepository: jest.Mocked<IDashboardRepository> = {
  getTravelWithMembersAndCategories: jest.fn(),
  getSpendingByMember: jest.fn(),
  getSpendingByCategory: jest.fn(),
};

function makeTravelData(overrides: Record<string, unknown> = {}) {
  return {
    id: 'travel-1',
    currency: 'EUR',
    budget: 5000,
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
        budgetLimit: 1000,
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
  };
}

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: DASHBOARD_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    service = module.get(DashboardService);
    jest.clearAllMocks();
  });

  it('returns correct member spending aggregation with multiple members', async () => {
    mockRepository.getTravelWithMembersAndCategories.mockResolvedValue(makeTravelData());
    mockRepository.getSpendingByMember.mockResolvedValue([
      { memberId: 'member-1', totalSpent: 300 },
      { memberId: 'member-2', totalSpent: 200 },
    ]);
    mockRepository.getSpendingByCategory.mockResolvedValue([
      { categoryId: 'cat-1', totalSpent: 350 },
      { categoryId: 'cat-2', totalSpent: 150 },
    ]);

    const result = await service.getDashboard('travel-1');

    expect(result.memberSpending).toEqual([
      { memberId: 'member-1', displayName: 'Alice', totalSpent: 300 },
      { memberId: 'member-2', displayName: 'Bob (guest)', totalSpent: 200 },
    ]);
  });

  it('returns zero-amount entries for members with no expenses', async () => {
    mockRepository.getTravelWithMembersAndCategories.mockResolvedValue(makeTravelData());
    mockRepository.getSpendingByMember.mockResolvedValue([
      { memberId: 'member-1', totalSpent: 500 },
    ]);
    mockRepository.getSpendingByCategory.mockResolvedValue([
      { categoryId: 'cat-1', totalSpent: 500 },
    ]);

    const result = await service.getDashboard('travel-1');

    const bob = result.memberSpending.find((m) => m.memberId === 'member-2');
    expect(bob).toEqual({
      memberId: 'member-2',
      displayName: 'Bob (guest)',
      totalSpent: 0,
    });
  });

  it('returns correct category spending with budget limits', async () => {
    mockRepository.getTravelWithMembersAndCategories.mockResolvedValue(makeTravelData());
    mockRepository.getSpendingByMember.mockResolvedValue([]);
    mockRepository.getSpendingByCategory.mockResolvedValue([
      { categoryId: 'cat-1', totalSpent: 700 },
      { categoryId: 'cat-2', totalSpent: 150 },
    ]);

    const result = await service.getDashboard('travel-1');

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
    ]);
  });

  it('computes ok status when spending < 80% of category limit', async () => {
    mockRepository.getTravelWithMembersAndCategories.mockResolvedValue(makeTravelData());
    mockRepository.getSpendingByMember.mockResolvedValue([]);
    mockRepository.getSpendingByCategory.mockResolvedValue([
      { categoryId: 'cat-1', totalSpent: 799 },
    ]);

    const result = await service.getDashboard('travel-1');

    const food = result.categorySpending.find((c) => c.categoryId === 'cat-1');
    expect(food?.status).toBe('ok');
  });

  it('computes warning status when spending >= 80% and < 100% of category limit', async () => {
    mockRepository.getTravelWithMembersAndCategories.mockResolvedValue(makeTravelData());
    mockRepository.getSpendingByMember.mockResolvedValue([]);
    mockRepository.getSpendingByCategory.mockResolvedValue([
      { categoryId: 'cat-1', totalSpent: 800 },
    ]);

    const result = await service.getDashboard('travel-1');

    const food = result.categorySpending.find((c) => c.categoryId === 'cat-1');
    expect(food?.status).toBe('warning');
  });

  it('computes exceeded status when spending >= 100% of category limit', async () => {
    mockRepository.getTravelWithMembersAndCategories.mockResolvedValue(makeTravelData());
    mockRepository.getSpendingByMember.mockResolvedValue([]);
    mockRepository.getSpendingByCategory.mockResolvedValue([
      { categoryId: 'cat-1', totalSpent: 1000 },
    ]);

    const result = await service.getDashboard('travel-1');

    const food = result.categorySpending.find((c) => c.categoryId === 'cat-1');
    expect(food?.status).toBe('exceeded');
  });

  it('returns ok for categories without a budget limit (null)', async () => {
    mockRepository.getTravelWithMembersAndCategories.mockResolvedValue(makeTravelData());
    mockRepository.getSpendingByMember.mockResolvedValue([]);
    mockRepository.getSpendingByCategory.mockResolvedValue([
      { categoryId: 'cat-2', totalSpent: 99999 },
    ]);

    const result = await service.getDashboard('travel-1');

    const transport = result.categorySpending.find((c) => c.categoryId === 'cat-2');
    expect(transport?.status).toBe('ok');
  });

  it('computes correct overall budget status', async () => {
    mockRepository.getTravelWithMembersAndCategories.mockResolvedValue(makeTravelData());
    mockRepository.getSpendingByMember.mockResolvedValue([]);
    mockRepository.getSpendingByCategory.mockResolvedValue([
      { categoryId: 'cat-1', totalSpent: 4000 },
      { categoryId: 'cat-2', totalSpent: 500 },
    ]);

    const result = await service.getDashboard('travel-1');

    expect(result.overall).toEqual({
      budget: 5000,
      totalSpent: 4500,
      status: 'warning',
    });
  });

  it('handles travel with no expenses (all zeros)', async () => {
    mockRepository.getTravelWithMembersAndCategories.mockResolvedValue(makeTravelData());
    mockRepository.getSpendingByMember.mockResolvedValue([]);
    mockRepository.getSpendingByCategory.mockResolvedValue([]);

    const result = await service.getDashboard('travel-1');

    expect(result.overall.totalSpent).toBe(0);
    expect(result.overall.status).toBe('ok');
    result.memberSpending.forEach((m) => expect(m.totalSpent).toBe(0));
    result.categorySpending.forEach((c) => expect(c.totalSpent).toBe(0));
  });

  it('throws EntityNotFoundError for non-existent travel', async () => {
    mockRepository.getTravelWithMembersAndCategories.mockResolvedValue(null);
    mockRepository.getSpendingByMember.mockResolvedValue([]);
    mockRepository.getSpendingByCategory.mockResolvedValue([]);

    await expect(service.getDashboard('nonexistent')).rejects.toThrow(EntityNotFoundError);
  });

  it('uses correct display name (user name for registered, guestName for guests)', async () => {
    mockRepository.getTravelWithMembersAndCategories.mockResolvedValue(makeTravelData());
    mockRepository.getSpendingByMember.mockResolvedValue([]);
    mockRepository.getSpendingByCategory.mockResolvedValue([]);

    const result = await service.getDashboard('travel-1');

    expect(result.memberSpending[0].displayName).toBe('Alice');
    expect(result.memberSpending[1].displayName).toBe('Bob (guest)');
  });

  it('returns correct currency from the travel', async () => {
    mockRepository.getTravelWithMembersAndCategories.mockResolvedValue(
      makeTravelData({ currency: 'USD' }),
    );
    mockRepository.getSpendingByMember.mockResolvedValue([]);
    mockRepository.getSpendingByCategory.mockResolvedValue([]);

    const result = await service.getDashboard('travel-1');

    expect(result.currency).toBe('USD');
  });
});
