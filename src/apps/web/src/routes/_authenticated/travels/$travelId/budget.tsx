import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { BudgetBreakdownPage } from '@repo/features';

export const Route = createFileRoute('/_authenticated/travels/$travelId/budget')({
  component: BudgetRoute,
});

function BudgetRoute() {
  const navigate = useNavigate();
  const { travelId } = Route.useParams();

  return (
    <BudgetBreakdownPage
      onManageCategories={() =>
        navigate({ to: '/travels/$travelId/categories', params: { travelId } })
      }
    />
  );
}
