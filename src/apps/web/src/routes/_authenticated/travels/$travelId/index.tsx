import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { DashboardPage } from '@repo/features';

export const Route = createFileRoute('/_authenticated/travels/$travelId/')({
  component: DashboardRoute,
});

function DashboardRoute() {
  const navigate = useNavigate();
  const { travelId } = Route.useParams();

  return (
    <DashboardPage
      onSeeAllCategories={() =>
        navigate({ to: '/travels/$travelId/budget', params: { travelId } })
      }
      onViewAllExpenses={() =>
        navigate({ to: '/travels/$travelId/expenses', params: { travelId } })
      }
    />
  );
}
