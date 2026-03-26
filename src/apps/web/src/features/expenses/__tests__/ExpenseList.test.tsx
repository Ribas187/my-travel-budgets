import { readFileSync } from 'fs';
import { resolve } from 'path';

import { describe, it, expect, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('@repo/api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@repo/api-client')>();
  return {
    ...actual,
    useTravelExpenses: () => ({ data: [], isLoading: false }),
  };
});

// Read the source file for style assertions
const sourcePath = resolve(__dirname, '../../../../../../packages/ui/src/templates/ExpenseListView/ExpenseListView.tsx');
const source = readFileSync(sourcePath, 'utf-8');

describe('ExpenseList search input height', () => {
  it('SearchInput styled component has minHeight of 48', () => {
    // Verify the SearchInput styled component includes minHeight: 48
    expect(source).toContain('minHeight: 48');
  });
});

describe('ExpenseList filter bar spacing', () => {
  it('FilterBar has reduced marginBottom of $sm', () => {
    // FilterBar was changed from $md to $sm
    expect(source).toMatch(/FilterBar\s*=\s*styled\(ScrollView,\s*\{[^}]*marginBottom:\s*'\$sm'/s);
  });

  it('FilterBarContent has no paddingVertical', () => {
    // FilterBarContent paddingVertical was removed
    // Verify it does NOT have paddingVertical in its styled definition
    const filterBarContentMatch = source.match(
      /FilterBarContent\s*=\s*styled\(XStack,\s*\{([^}]*)\}/s,
    );
    expect(filterBarContentMatch).toBeTruthy();
    expect(filterBarContentMatch![1]).not.toContain('paddingVertical');
  });
});

describe('ExpenseList filter chips', () => {
  it('renders filter chips with categories (no regression)', () => {
    // The FilterBar renders FilterChip components for each category
    // Verify the source renders "All" chip and maps over categories
    expect(source).toContain("t('expense.allCategories')");
    expect(source).toContain('travel.categories');
    expect(source).toContain('FilterChip');
  });
});
