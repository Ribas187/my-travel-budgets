import { describe, it, expect } from 'vitest';
import * as apiClient from '../index';

describe('package exports', () => {
  describe('existing exports (backward compatibility)', () => {
    it('exports ApiClient class', () => {
      expect(apiClient.ApiClient).toBeDefined();
      expect(typeof apiClient.ApiClient).toBe('function');
    });

    it('exports queryKeys', () => {
      expect(apiClient.queryKeys).toBeDefined();
      expect(apiClient.queryKeys.travels).toBeDefined();
      expect(apiClient.queryKeys.expenses).toBeDefined();
    });
  });

  describe('provider exports', () => {
    it('exports ApiClientProvider', () => {
      expect(apiClient.ApiClientProvider).toBeDefined();
      expect(typeof apiClient.ApiClientProvider).toBe('function');
    });

    it('exports useApiClient', () => {
      expect(apiClient.useApiClient).toBeDefined();
      expect(typeof apiClient.useApiClient).toBe('function');
    });
  });

  describe('query config exports', () => {
    it('exports defaultQueryOptions', () => {
      expect(apiClient.defaultQueryOptions).toBeDefined();
    });

    it('exports createDefaultQueryClient', () => {
      expect(apiClient.createDefaultQueryClient).toBeDefined();
      expect(typeof apiClient.createDefaultQueryClient).toBe('function');
    });
  });

  describe('all 23 hooks are importable', () => {
    const hookNames = [
      // Travels (6)
      'useTravels',
      'useTravelDetail',
      'useTravelCategories',
      'useCreateTravel',
      'useUpdateTravel',
      'useDeleteTravel',
      // Expenses (5)
      'useTravelExpenses',
      'useCreateExpense',
      'useUpdateExpense',
      'useDeleteExpense',
      'useBudgetImpact',
      // Categories (3)
      'useCreateCategory',
      'useUpdateCategory',
      'useDeleteCategory',
      // Members (2)
      'useAddMember',
      'useRemoveMember',
      // Users (5)
      'useUserMe',
      'useUpdateUser',
      'useSetMainTravel',
      'useUploadAvatar',
      'useRemoveAvatar',
      // Dashboard (1)
      'useDashboard',
      // Receipts (1)
      'useExtractReceipt',
    ];

    it.each(hookNames)('exports %s as a function', (hookName) => {
      const exported = (apiClient as Record<string, unknown>)[hookName];
      expect(exported).toBeDefined();
      expect(typeof exported).toBe('function');
    });
  });
});
