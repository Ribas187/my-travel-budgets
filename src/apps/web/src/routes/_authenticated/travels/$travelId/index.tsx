import { createFileRoute } from '@tanstack/react-router'
import { DashboardPage } from '@/features/dashboard/DashboardPage'

export const Route = createFileRoute('/_authenticated/travels/$travelId/')({
  component: DashboardPage,
})
