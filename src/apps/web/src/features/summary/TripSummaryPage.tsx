import { TripSummaryView } from '@repo/ui';

import { useDashboard, useTravelExpenses } from '@repo/api-client';

import { useTravelContext } from '@/contexts/TravelContext';

export function TripSummaryPage() {
  const { travel } = useTravelContext();
  const { data: dashboard } = useDashboard(travel.id);
  const { data: expenses } = useTravelExpenses(travel.id);

  return (
    <TripSummaryView
      travel={travel}
      dashboard={dashboard ?? null}
      expenses={expenses ?? null}
    />
  );
}
