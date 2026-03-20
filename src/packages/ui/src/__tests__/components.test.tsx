import { describe, it, expect } from 'vitest';

import { PrimaryButton } from '../PrimaryButton';
import { FAB } from '../FAB';
import { CategoryChip } from '../CategoryChip';
import { FilterChip } from '../FilterChip';
import { ExpenseRow } from '../ExpenseRow';
import { DayGroupHeader } from '../DayGroupHeader';
import { AmountInput } from '../AmountInput';
import { BudgetImpactBanner } from '../BudgetImpactBanner';
import { StatCard } from '../StatCard';
import { CategoryEditCard } from '../CategoryEditCard';
import { AvatarChip } from '../AvatarChip';

// ---------------------------------------------------------------------------
// All components render without errors (importable & callable)
// ---------------------------------------------------------------------------

describe('Component exports', () => {
  it('PrimaryButton is defined', () => {
    expect(PrimaryButton).toBeDefined();
    expect(typeof PrimaryButton).toBe('function');
  });

  it('FAB is defined', () => {
    expect(FAB).toBeDefined();
    expect(typeof FAB).toBe('function');
  });

  it('CategoryChip is defined', () => {
    expect(CategoryChip).toBeDefined();
    expect(typeof CategoryChip).toBe('function');
  });

  it('FilterChip is defined', () => {
    expect(FilterChip).toBeDefined();
    expect(typeof FilterChip).toBe('function');
  });

  it('ExpenseRow is defined', () => {
    expect(ExpenseRow).toBeDefined();
    expect(typeof ExpenseRow).toBe('function');
  });

  it('DayGroupHeader is defined', () => {
    expect(DayGroupHeader).toBeDefined();
    expect(typeof DayGroupHeader).toBe('function');
  });

  it('AmountInput is defined', () => {
    expect(AmountInput).toBeDefined();
    expect(typeof AmountInput).toBe('function');
  });

  it('BudgetImpactBanner is defined', () => {
    expect(BudgetImpactBanner).toBeDefined();
    expect(typeof BudgetImpactBanner).toBe('function');
  });

  it('StatCard is defined', () => {
    expect(StatCard).toBeDefined();
    expect(typeof StatCard).toBe('function');
  });

  it('CategoryEditCard is defined', () => {
    expect(CategoryEditCard).toBeDefined();
    expect(typeof CategoryEditCard).toBe('function');
  });

  it('AvatarChip is defined', () => {
    expect(AvatarChip).toBeDefined();
    expect(typeof AvatarChip).toBe('function');
  });
});
