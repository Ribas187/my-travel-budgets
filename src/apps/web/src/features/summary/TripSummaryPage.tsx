import { TripSummaryView } from '@repo/ui';

import { useTravelContext } from '@/contexts/TravelContext';
import { useDashboard } from '@/hooks/useDashboard';
import { useTravelExpenses } from '@/hooks/useTravelExpenses';

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
