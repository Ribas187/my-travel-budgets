import { createFileRoute } from '@tanstack/react-router'
import { TripSummaryPage } from '@/features/summary/TripSummaryPage'

export const Route = createFileRoute(
  '/_authenticated/travels/$travelId/summary',
)({
  component: TripSummaryPage,
})
