/**
 * Returns a color hex value based on the budget usage percentage.
 * - < 70%: teal (safe)
 * - 70–99%: amber (warning)
 * - >= 100%: coral (danger)
 */
export function getBudgetStatusColor(percentage: number): string {
  if (percentage >= 100) return '#EF4444'; // coral500
  if (percentage >= 70) return '#F59E0B'; // amber500
  return '#0D9488'; // teal500
}

export type BudgetStatus = 'safe' | 'warning' | 'danger';

export function getBudgetStatus(percentage: number): BudgetStatus {
  if (percentage >= 100) return 'danger';
  if (percentage >= 70) return 'warning';
  return 'safe';
}
