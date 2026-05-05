// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiClient, ApiClientProvider } from '@repo/api-client';
import type { TravelDetail } from '@repo/api-client';

import { TravelProvider } from '../context/TravelContext';
import { AddExpenseModal } from './AddExpenseModal';

let capturedProps: Record<string, unknown> = {};

vi.mock('@repo/ui', () => ({
  AddExpenseModal: (props: Record<string, unknown>) => {
    capturedProps = props;
    return <div data-testid="add-expense-modal-ui" />;
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockTravel: TravelDetail = {
  id: 't1',
  name: 'Test Trip',
  description: null,
  imageUrl: null,
  currency: 'USD',
  budget: 1000,
  startDate: '2026-01-01',
  endDate: '2026-01-10',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  members: [],
  categories: [],
};

const mockDashboard = {
  currency: 'USD',
  overall: { totalBudget: 1000, totalSpent: 500, remaining: 500, status: 'ok' as const },
  memberSpending: [],
  categorySpending: [
    { categoryId: 'c1', name: 'Food', totalSpent: 200, budgetLimit: 500 },
  ],
};

function createMockClient() {
  const client = new ApiClient({
    baseUrl: 'http://localhost:3000',
    getToken: () => 'test-token',
  });
  client.expenses.create = vi.fn().mockResolvedValue({ id: 'new-e' });
  client.expenses.update = vi.fn().mockResolvedValue({ id: 'e1' });
  client.expenses.delete = vi.fn().mockResolvedValue({});
  client.dashboard.get = vi.fn().mockResolvedValue(mockDashboard);
  // `receipts` is a `readonly` member on the ApiClient class — overwrite it
  // via Object.defineProperty so we keep type-safety elsewhere.
  Object.defineProperty(client, 'receipts', {
    value: {
      extract: vi.fn().mockResolvedValue({
        total: 42.5,
        date: '2026-05-05',
        merchant: 'Café Central',
      }),
    },
    writable: true,
    configurable: true,
  });
  return client;
}

function renderAddExpenseModal(props: Partial<Parameters<typeof AddExpenseModal>[0]> = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const mockClient = createMockClient();

  return {
    ...render(
      <ApiClientProvider client={mockClient}>
        <QueryClientProvider client={queryClient}>
          <TravelProvider travel={mockTravel} isOwner={true} currentUserId="u1">
            <AddExpenseModal open={true} onClose={() => {}} {...props} />
          </TravelProvider>
        </QueryClientProvider>
      </ApiClientProvider>,
    ),
    mockClient,
    queryClient,
  };
}

afterEach(() => {
  cleanup();
  capturedProps = {};
});

describe('AddExpenseModal', () => {
  it('calls onSuccess after successful create mutation (not showToast)', async () => {
    const onSuccess = vi.fn();
    const onClose = vi.fn();
    const { mockClient } = renderAddExpenseModal({ onSuccess, onClose });

    // The mocked UI component captures the onSave handler
    expect(capturedProps.onSave).toBeDefined();

    const handleSave = capturedProps.onSave as (data: unknown) => void;

    await act(async () => {
      handleSave({
        description: 'Test expense',
        amount: 100,
        categoryId: 'c1',
        memberId: 'm1',
        date: '2026-01-05',
      });
    });

    expect(mockClient.expenses.create).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledWith('expense.saved');
    expect(onClose).toHaveBeenCalled();
  });

  it('preserves budget impact watching logic with onCategoryChange and onAmountChange', () => {
    renderAddExpenseModal();

    // The modal should pass budget impact watching callbacks to the UI
    expect(capturedProps.onCategoryChange).toBeDefined();
    expect(capturedProps.onAmountChange).toBeDefined();
    expect(capturedProps.budgetImpact).toBeDefined();
  });

  it('passes onNavigateToCategories to UI component', () => {
    const onNavigateToCategories = vi.fn();
    renderAddExpenseModal({ onNavigateToCategories });

    expect(capturedProps.onNavigateToCategories).toBe(onNavigateToCategories);
  });

  it('initializes watched state from expense when editing', () => {
    const expense = {
      id: 'e1',
      travelId: 't1',
      categoryId: 'c1',
      memberId: 'm1',
      amount: 150,
      description: 'Existing',
      date: '2026-01-02',
      createdAt: '2026-01-02T00:00:00Z',
      updatedAt: '2026-01-02T00:00:00Z',
    };

    renderAddExpenseModal({ expense });

    // The expense data should be passed through to the UI
    expect(capturedProps.expense).toBe(expense);
  });
});

describe('AddExpenseModal — scan-receipt orchestration', () => {
  it('does NOT expose onScanFile when prepareImage is not provided', () => {
    renderAddExpenseModal();
    expect(capturedProps.onScanFile).toBeUndefined();
  });

  it('does NOT expose onScanFile when in edit mode (scan is new-expense only)', () => {
    const prepareImage = vi.fn(async (f: File) => f);
    const expense = {
      id: 'e1',
      travelId: 't1',
      categoryId: 'c1',
      memberId: 'm1',
      amount: 150,
      description: 'Existing',
      date: '2026-01-02',
      createdAt: '2026-01-02T00:00:00Z',
      updatedAt: '2026-01-02T00:00:00Z',
    };
    renderAddExpenseModal({ prepareImage, expense });
    expect(capturedProps.onScanFile).toBeUndefined();
  });

  it('runs prepareImage → extract → sets prefill on the happy path', async () => {
    const prepareImage = vi.fn(async (file: File) => new Blob([await file.arrayBuffer()], { type: 'image/jpeg' }));
    const { mockClient } = renderAddExpenseModal({ prepareImage });

    expect(capturedProps.onScanFile).toBeDefined();
    const handle = capturedProps.onScanFile as (f: File) => void;
    const file = new File([new Uint8Array([1, 2, 3])], 'r.jpg', { type: 'image/jpeg' });

    await act(async () => {
      handle(file);
      // Allow the chained microtasks (prepareImage + mutateAsync) to resolve.
      await Promise.resolve();
      await Promise.resolve();
    });

    await act(async () => {
      // One more microtask flush for setState after mutateAsync resolves.
      await Promise.resolve();
    });

    expect(prepareImage).toHaveBeenCalledWith(file);
    expect(mockClient.receipts.extract).toHaveBeenCalledTimes(1);
    expect(capturedProps.prefill).toEqual({
      total: 42.5,
      date: '2026-05-05',
      merchant: 'Café Central',
    });
    expect(capturedProps.scanError).toBe(null);
  });

  it('rejects wrong MIME type locally without calling the API', async () => {
    const prepareImage = vi.fn(async (f: File) => f);
    const { mockClient } = renderAddExpenseModal({ prepareImage });

    const handle = capturedProps.onScanFile as (f: File) => void;
    const file = new File([new Uint8Array([1])], 'r.gif', { type: 'image/gif' });

    await act(async () => {
      handle(file);
      await Promise.resolve();
    });

    expect(prepareImage).not.toHaveBeenCalled();
    expect(mockClient.receipts.extract).not.toHaveBeenCalled();
    expect(capturedProps.scanError).toBe('receipt.error.wrongType');
  });

  it('rejects oversized files locally without calling the API', async () => {
    const prepareImage = vi.fn(async (f: File) => f);
    const { mockClient } = renderAddExpenseModal({ prepareImage });

    const handle = capturedProps.onScanFile as (f: File) => void;
    // Build a File whose .size > 5 MB. Using a sparse Uint8Array keeps memory
    // reasonable in tests.
    const big = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'big.jpg', { type: 'image/jpeg' });

    await act(async () => {
      handle(big);
      await Promise.resolve();
    });

    expect(prepareImage).not.toHaveBeenCalled();
    expect(mockClient.receipts.extract).not.toHaveBeenCalled();
    expect(capturedProps.scanError).toBe('receipt.error.tooLarge');
  });

  it('maps a 422 from the extract API to receipt.error.unreadable', async () => {
    const prepareImage = vi.fn(async (f: File) => f);
    const { mockClient } = renderAddExpenseModal({ prepareImage });
    (mockClient.receipts.extract as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce({
      statusCode: 422,
      message: 'unreadable',
    });

    const handle = capturedProps.onScanFile as (f: File) => void;
    const file = new File([new Uint8Array([1])], 'r.jpg', { type: 'image/jpeg' });

    await act(async () => {
      handle(file);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(capturedProps.scanError).toBe('receipt.error.unreadable');
    expect(capturedProps.prefill).toBe(null);
  });

  it('maps a 502 from the extract API to receipt.error.upstream', async () => {
    const prepareImage = vi.fn(async (f: File) => f);
    const { mockClient } = renderAddExpenseModal({ prepareImage });
    (mockClient.receipts.extract as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce({
      statusCode: 502,
      message: 'upstream',
    });

    const handle = capturedProps.onScanFile as (f: File) => void;
    const file = new File([new Uint8Array([1])], 'r.jpg', { type: 'image/jpeg' });

    await act(async () => {
      handle(file);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(capturedProps.scanError).toBe('receipt.error.upstream');
  });

  it('Continue manually clears the prefill and the error', async () => {
    const prepareImage = vi.fn(async (f: File) => f);
    renderAddExpenseModal({ prepareImage });

    const handle = capturedProps.onScanFile as (f: File) => void;
    await act(async () => {
      handle(new File([new Uint8Array([1])], 'r.jpg', { type: 'image/jpeg' }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(capturedProps.prefill).not.toBeNull();

    await act(async () => {
      (capturedProps.onScanContinueManually as () => void)();
    });

    expect(capturedProps.prefill).toBe(null);
    expect(capturedProps.scanError).toBe(null);
  });

  it('Retry re-runs extraction with the same file', async () => {
    const prepareImage = vi.fn(async (f: File) => f);
    const { mockClient } = renderAddExpenseModal({ prepareImage });
    (mockClient.receipts.extract as unknown as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce({ statusCode: 502 })
      .mockResolvedValueOnce({ total: 7, date: '2026-05-05', merchant: 'X' });

    const handle = capturedProps.onScanFile as (f: File) => void;
    const file = new File([new Uint8Array([1])], 'r.jpg', { type: 'image/jpeg' });

    await act(async () => {
      handle(file);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(capturedProps.scanError).toBe('receipt.error.upstream');
    expect(capturedProps.onScanRetry).toBeDefined();

    await act(async () => {
      (capturedProps.onScanRetry as () => void)();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockClient.receipts.extract).toHaveBeenCalledTimes(2);
    expect(capturedProps.prefill).toEqual({ total: 7, date: '2026-05-05', merchant: 'X' });
    expect(capturedProps.scanError).toBe(null);
  });

  // Regression: BUG-02 / RF 3.7 — wrapper exposes a cancel handler that
  // aborts the in-flight extraction and clears the related state.
  it('onScanCancel aborts the request and clears scan state', async () => {
    const prepareImage = vi.fn(async (f: File) => f);
    const { mockClient } = renderAddExpenseModal({ prepareImage });

    // Make extract hang so we have an "in-flight" request to cancel.
    (mockClient.receipts.extract as unknown as ReturnType<typeof vi.fn>)
      .mockImplementationOnce(
        (_t: string, _f: Blob, opts?: { signal?: AbortSignal }) =>
          new Promise((_resolve, reject) => {
            opts?.signal?.addEventListener('abort', () => {
              const err = new Error('Aborted');
              (err as Error & { name: string }).name = 'AbortError';
              reject(err);
            });
          }),
      );

    const handle = capturedProps.onScanFile as (f: File) => void;
    await act(async () => {
      handle(new File([new Uint8Array([1])], 'r.jpg', { type: 'image/jpeg' }));
      await Promise.resolve();
    });

    expect(capturedProps.onScanCancel).toBeDefined();

    await act(async () => {
      (capturedProps.onScanCancel as () => void)();
      await Promise.resolve();
      await Promise.resolve();
    });

    // After cancel, scan state is cleared.
    expect(capturedProps.scanError).toBe(null);
    expect(capturedProps.prefill).toBe(null);
  });

  // Regression: BUG-05 / RF 4.5 — user MUST be able to discard extracted values.
  it('onScanDiscard clears prefill back to null after a successful scan', async () => {
    const prepareImage = vi.fn(async (f: File) => f);
    renderAddExpenseModal({ prepareImage });

    const handle = capturedProps.onScanFile as (f: File) => void;
    await act(async () => {
      handle(new File([new Uint8Array([1])], 'r.jpg', { type: 'image/jpeg' }));
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(capturedProps.prefill).not.toBeNull();
    expect(capturedProps.onScanDiscard).toBeDefined();

    await act(async () => {
      (capturedProps.onScanDiscard as () => void)();
    });

    expect(capturedProps.prefill).toBe(null);
    expect(capturedProps.scanError).toBe(null);
  });
});
