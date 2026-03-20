import { createFileRoute } from '@tanstack/react-router';

import { BudgetBreakdownPage } from '@/features/budget/BudgetBreakdownPage';

export const Route = createFileRoute('/_authenticated/travels/$travelId/budget')({
  component: BudgetBreakdownPage,
});
