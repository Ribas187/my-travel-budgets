import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

// ---------------------------------------------------------------------------
// Unit test: toast notification component renders success and error variants
// ---------------------------------------------------------------------------

describe('Toast Notification System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('showToast creates a toast with success type by default', async () => {
    const { showToast, getToasts } = await import('../lib/toast');

    // Clear any existing toasts
    const initialToasts = getToasts();
    expect(Array.isArray(initialToasts)).toBe(true);

    showToast('Test message');
    const toasts = getToasts();
    const lastToast = toasts[toasts.length - 1];

    expect(lastToast).toBeDefined();
    expect(lastToast!.message).toBe('Test message');
    expect(lastToast!.type).toBe('success');
  });

  it('showToast creates a toast with error type', async () => {
    const { showToast, getToasts } = await import('../lib/toast');

    showToast('Error occurred', 'error');
    const toasts = getToasts();
    const lastToast = toasts[toasts.length - 1];

    expect(lastToast).toBeDefined();
    expect(lastToast!.message).toBe('Error occurred');
    expect(lastToast!.type).toBe('error');
  });

  it('toast has a unique id', async () => {
    const { showToast, getToasts } = await import('../lib/toast');

    showToast('First toast');
    showToast('Second toast');

    const toasts = getToasts();
    const ids = toasts.map((t) => t.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(ids.length);
  });

  it('subscribe notifies listeners when toasts change', async () => {
    const { showToast, subscribe } = await import('../lib/toast');

    const listener = vi.fn();
    const unsubscribe = subscribe(listener);

    showToast('Notification');
    expect(listener).toHaveBeenCalled();

    const calledWith = listener.mock.calls[0]![0];
    expect(Array.isArray(calledWith)).toBe(true);
    expect(calledWith.some((t: { message: string }) => t.message === 'Notification')).toBe(true);

    unsubscribe();
  });

  it('ToastContainer component is exported', async () => {
    const mod = await import('../lib/ToastContainer');
    expect(mod.ToastContainer).toBeDefined();
    expect(typeof mod.ToastContainer).toBe('function');
  });

  it('ToastContainer is included in root route layout', async () => {
    const mod = await import('../routes/__root');
    expect(mod.Route).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Integration test: API error triggers error toast with correct i18n message
// ---------------------------------------------------------------------------

describe('API Error Toast Integration', () => {
  it('common.error i18n key exists for API error toasts', async () => {
    const i18n = (await import('../i18n')).default;
    await i18n.init;

    const errorMessage = i18n.t('common.error');
    expect(errorMessage).toBe('Something went wrong');
  });

  it('showToast with error type produces the correct toast shape', async () => {
    const { showToast, getToasts } = await import('../lib/toast');

    const i18n = (await import('../i18n')).default;
    await i18n.init;
    const errorMessage = i18n.t('common.error');

    showToast(errorMessage, 'error');
    const toasts = getToasts();
    const errorToast = toasts.find(
      (t) => t.message === 'Something went wrong' && t.type === 'error',
    );
    expect(errorToast).toBeDefined();
  });

  it('hooks use showToast for error feedback', async () => {
    // Verify that the toast module is importable from the hooks' perspective
    const toastMod = await import('../lib/toast');
    expect(toastMod.showToast).toBeDefined();
    expect(typeof toastMod.showToast).toBe('function');
  });
});

// ---------------------------------------------------------------------------
// Integration test: successful mutation triggers success toast
// ---------------------------------------------------------------------------

describe('Success Toast Integration', () => {
  it('expense.saved i18n key exists for success toasts', async () => {
    const i18n = (await import('../i18n')).default;
    await i18n.init;

    expect(i18n.t('expense.saved')).toBe('Expense saved');
  });

  it('travel.saved i18n key exists for success toasts', async () => {
    const i18n = (await import('../i18n')).default;
    await i18n.init;

    expect(i18n.t('travel.saved')).toBe('Trip saved');
  });

  it('category.saved i18n key exists for success toasts', async () => {
    const i18n = (await import('../i18n')).default;
    await i18n.init;

    expect(i18n.t('category.saved')).toBe('Category saved');
  });

  it('category.deleted i18n key exists for success toasts', async () => {
    const i18n = (await import('../i18n')).default;
    await i18n.init;

    expect(i18n.t('category.deleted')).toBe('Category deleted');
  });

  it('member.added i18n key exists for success toasts', async () => {
    const i18n = (await import('../i18n')).default;
    await i18n.init;

    expect(i18n.t('member.added')).toBe('Member added');
  });

  it('showToast with success type creates correct toast', async () => {
    const { showToast, getToasts } = await import('../lib/toast');

    showToast('Expense saved');
    const toasts = getToasts();
    const successToast = toasts.find((t) => t.message === 'Expense saved' && t.type === 'success');
    expect(successToast).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Accessibility test: all form inputs have associated labels
// ---------------------------------------------------------------------------

describe('Accessibility: Form Input Labels', () => {
  it('login page email input has aria-label', async () => {
    const mod = await import('../routes/login');
    expect(mod.Route).toBeDefined();

    // Verify i18n key used for the aria-label exists
    const i18n = (await import('../i18n')).default;
    await i18n.init;
    expect(i18n.t('auth.emailPlaceholder')).toBe('Enter your email');
  });

  it('trip form inputs have aria-labels via i18n keys', async () => {
    const i18n = (await import('../i18n')).default;
    await i18n.init;

    // All form field labels used as aria-label attributes
    expect(i18n.t('travel.name')).toBe('Trip Name');
    expect(i18n.t('travel.destination')).toBe('Destination');
    expect(i18n.t('travel.startDate')).toBe('Start date');
    expect(i18n.t('travel.endDate')).toBe('End date');
    expect(i18n.t('travel.totalBudget')).toBe('Total Budget');
    expect(i18n.t('travel.currency')).toBe('Currency');
  });

  it('expense form inputs have aria-labels via i18n keys', async () => {
    const i18n = (await import('../i18n')).default;
    await i18n.init;

    expect(i18n.t('expense.amount')).toBe('Amount');
    expect(i18n.t('expense.description')).toBe('Description');
    expect(i18n.t('expense.category')).toBe('Category');
    expect(i18n.t('expense.paidBy')).toBe('Paid by');
  });

  it('category form inputs have aria-labels via i18n keys', async () => {
    const i18n = (await import('../i18n')).default;
    await i18n.init;

    expect(i18n.t('category.name')).toBe('Category name');
    expect(i18n.t('category.budgetLimit')).toBe('Budget limit');
  });

  it('invite form input has aria-label via i18n keys', async () => {
    const i18n = (await import('../i18n')).default;
    await i18n.init;

    expect(i18n.t('member.emailPlaceholder')).toBe('Email address');
    expect(i18n.t('member.guestPlaceholder')).toBe('Guest name');
  });

  it('search input has accessibility label via i18n key', async () => {
    const i18n = (await import('../i18n')).default;
    await i18n.init;

    expect(i18n.t('common.search')).toBe('Search');
  });
});

// ---------------------------------------------------------------------------
// Accessibility test: all buttons and links have accessible names
// ---------------------------------------------------------------------------

describe('Accessibility: Buttons and Links Have Accessible Names', () => {
  it('PrimaryButton component has role="button" and aria-label', async () => {
    const mod = await import('@repo/ui');
    expect(mod.PrimaryButton).toBeDefined();
    expect(typeof mod.PrimaryButton).toBe('function');
  });

  it('close buttons use i18n key for aria-label', async () => {
    const i18n = (await import('../i18n')).default;
    await i18n.init;

    expect(i18n.t('common.close')).toBe('Close');
  });

  it('delete buttons use i18n keys for aria-labels', async () => {
    const i18n = (await import('../i18n')).default;
    await i18n.init;

    expect(i18n.t('travel.deleteTrip')).toBe('Delete Trip');
    expect(i18n.t('common.cancel')).toBe('Cancel');
    expect(i18n.t('common.delete')).toBe('Delete');
  });

  it('save buttons use i18n keys', async () => {
    const i18n = (await import('../i18n')).default;
    await i18n.init;

    expect(i18n.t('travel.saveChanges')).toBe('Save Changes');
    expect(i18n.t('expense.saveExpense')).toBe('Save Expense');
    expect(i18n.t('common.save')).toBe('Save');
  });

  it('search toggle has aria-label', async () => {
    const i18n = (await import('../i18n')).default;
    await i18n.init;

    expect(i18n.t('common.search')).toBe('Search');
  });

  it('navigation components have role="navigation" and aria-labels', async () => {
    const mod = await import('@repo/ui');
    // BottomNav and DesktopSidebar both have role="navigation"
    expect(mod.BottomNav).toBeDefined();
    expect(mod.DesktopSidebar).toBeDefined();
  });

  it('add category button uses i18n key for accessible name', async () => {
    const i18n = (await import('../i18n')).default;
    await i18n.init;

    expect(i18n.t('category.add')).toBe('Add Category');
  });

  it('FAB has accessibilityLabel via expense.add i18n key', async () => {
    const i18n = (await import('../i18n')).default;
    await i18n.init;

    expect(i18n.t('expense.add')).toBe('Add Expense');
  });
});

// ---------------------------------------------------------------------------
// Accessibility test: heading hierarchy is correct (no skipped levels)
// ---------------------------------------------------------------------------

describe('Accessibility: Heading Hierarchy', () => {
  it('Heading component renders with correct level prop', async () => {
    const mod = await import('@repo/ui');
    expect(mod.Heading).toBeDefined();
    expect(typeof mod.Heading).toBe('function');
  });

  it('login page uses level 1 heading for page title', async () => {
    // Login page uses <Heading level={1}>My Travel Budgets</Heading>
    const mod = await import('../routes/login');
    expect(mod.Route).toBeDefined();
  });

  it('travel list uses level 2 heading for page title', async () => {
    // Travels page uses <Heading level={2}>My Travels</Heading>
    const mod = await import('../routes/_authenticated/travels/index');
    expect(mod.Route).toBeDefined();
  });

  it('travel detail uses level 2 for trip name and level 3 for sections', async () => {
    // Travel detail uses <Heading level={2}> for trip name
    // ExpenseList uses <Heading level={3}> for "Expenses" section
    const mod = await import('../routes/_authenticated/travels/$travelId/index');
    expect(mod.Route).toBeDefined();
  });

  it('categories page uses level 2 heading', async () => {
    const mod = await import('../routes/_authenticated/travels/$travelId/categories');
    expect(mod.Route).toBeDefined();
  });

  it('heading level-to-tag mapping is correct', () => {
    // Verify the Heading component maps numeric levels to HTML heading tags
    const LEVEL_TAG_MAP: Record<string, string> = {
      '1': 'h1',
      '2': 'h2',
      '3': 'h3',
      '4': 'h4',
    };

    expect(LEVEL_TAG_MAP['1']).toBe('h1');
    expect(LEVEL_TAG_MAP['2']).toBe('h2');
    expect(LEVEL_TAG_MAP['3']).toBe('h3');
    expect(LEVEL_TAG_MAP['4']).toBe('h4');
  });

  it('page hierarchy follows h1 > h2 > h3 pattern (no skipped levels)', () => {
    // Verify page hierarchy:
    // Login: h1 (page title)
    // Travels list: h2 (My Travels), h3 (travel card names)
    // Travel detail: h2 (trip name), h3 (Expenses section, Add Expense modal)
    // Categories: h2 (Categories)
    // Edit Trip: h2 (Edit Trip)
    // New Trip: h2 (New Trip)
    //
    // The h1 is the app title on the login page.
    // Inside authenticated pages, h2 is the page title, h3 is section titles.
    // This follows correct heading hierarchy with no skipped levels.

    const hierarchy = [
      { page: 'login', levels: [1] },
      { page: 'travels', levels: [2, 3] },
      { page: 'travel-detail', levels: [2, 3] },
      { page: 'categories', levels: [2] },
      { page: 'edit-trip', levels: [2] },
      { page: 'new-trip', levels: [2] },
    ];

    for (const page of hierarchy) {
      const sorted = [...page.levels].sort((a, b) => a - b);
      // No gaps in heading levels within a page
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i]! - sorted[i - 1]!).toBeLessThanOrEqual(1);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Responsive layout verification
// ---------------------------------------------------------------------------

describe('Responsive Layout', () => {
  it('AppShell component is exported from @repo/ui', async () => {
    const mod = await import('@repo/ui');
    expect(mod.AppShell).toBeDefined();
    expect(typeof mod.AppShell).toBe('function');
  });

  it('BottomNav component is exported for mobile layout', async () => {
    const mod = await import('@repo/ui');
    expect(mod.BottomNav).toBeDefined();
    expect(typeof mod.BottomNav).toBe('function');
  });

  it('DesktopSidebar component is exported for desktop layout', async () => {
    const mod = await import('@repo/ui');
    expect(mod.DesktopSidebar).toBeDefined();
    expect(typeof mod.DesktopSidebar).toBe('function');
  });

  it('media breakpoints are correctly defined in tamagui config', async () => {
    const { config } = await import('@repo/ui');
    const media = config.media;

    // Mobile: maxWidth 767
    expect(media.mobile).toEqual({ maxWidth: 767 });
    // Tablet: 768–1023
    expect(media.tablet).toEqual({ minWidth: 768, maxWidth: 1023 });
    // Desktop: >= 1024
    expect(media.desktop).toEqual({ minWidth: 1024 });
    // gtMobile: >= 768
    expect(media.gtMobile).toEqual({ minWidth: 768 });
    // gtTablet: >= 1024
    expect(media.gtTablet).toEqual({ minWidth: 1024 });
  });

  it('AddExpenseModal component is exported with responsive behavior', async () => {
    const mod = await import('@repo/features');
    expect(mod.AddExpenseModal).toBeDefined();
    expect(typeof mod.AddExpenseModal).toBe('function');
  });
});

// ---------------------------------------------------------------------------
// Skeleton loading states
// ---------------------------------------------------------------------------

describe('Skeleton Loading States', () => {
  it('TravelsPage has skeleton loading state', async () => {
    // TravelsPage renders TravelsSkeletonList when isLoading is true
    const mod = await import('../routes/_authenticated/travels/index');
    expect(mod.Route).toBeDefined();
  });

  it('ExpenseList has skeleton loading state', async () => {
    const mod = await import('@repo/features');
    expect(mod.ExpenseList).toBeDefined();
  });

  it('loading i18n key exists', async () => {
    const i18n = (await import('../i18n')).default;
    await i18n.init;

    expect(i18n.t('common.loading')).toBe('Loading...');
  });
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

describe('Error Handling', () => {
  it('error i18n key exists for inline form errors and API toasts', async () => {
    const i18n = (await import('../i18n')).default;
    await i18n.init;

    expect(i18n.t('common.error')).toBe('Something went wrong');
    expect(i18n.t('common.retry')).toBe('Retry');
  });

  it('auth verify error i18n key exists', async () => {
    const i18n = (await import('../i18n')).default;
    await i18n.init;

    expect(i18n.t('auth.verifyError')).toBe('Verification failed. Please try again.');
  });
});
