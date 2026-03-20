import type { ExpenseFilters } from './types';

export const queryKeys = {
  travels: {
    all: ['travels'] as const,
    detail: (id: string) => ['travels', id] as const,
  },
  expenses: {
    list: (travelId: string, filters?: ExpenseFilters) =>
      ['travels', travelId, 'expenses', filters] as const,
  },
  categories: {
    list: (travelId: string) => ['travels', travelId, 'categories'] as const,
  },
  dashboard: {
    get: (travelId: string) => ['travels', travelId, 'dashboard'] as const,
  },
  users: {
    me: ['users', 'me'] as const,
  },
};
