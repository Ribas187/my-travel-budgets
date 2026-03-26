import { createFileRoute } from '@tanstack/react-router';
import { TripSummaryPage } from '@repo/features';

export const Route = createFileRoute('/_authenticated/travels/$travelId/summary')({
  component: TripSummaryPage,
});
