import { useTranslation } from 'react-i18next';
import { TripSummaryView, InlineTip } from '@repo/ui';
import { useDashboard, useTravelExpenses } from '@repo/api-client';

import { useTravelContext } from '../context/TravelContext';
import { useTip } from '../onboarding/useTip';

export function TripSummaryPage() {
  const { t } = useTranslation();
  const { travel } = useTravelContext();
  const { data: dashboard } = useDashboard(travel.id);
  const { data: expenses } = useTravelExpenses(travel.id);

  const { shouldShow: shouldShowTip, dismiss: dismissTip } = useTip('summary_first_visit');

  return (
    <>
      {shouldShowTip && (
        <InlineTip
          tipId="summary_first_visit"
          message={t('onboarding.tip.summaryFirstVisit')}
          icon="📈"
          onDismiss={dismissTip}
        />
      )}
      <TripSummaryView
        travel={travel}
        dashboard={dashboard ?? null}
        expenses={expenses ?? null}
      />
    </>
  );
}
