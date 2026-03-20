import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated')({
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  // TODO: Task 7.0 will implement actual auth guard
  // For now, render children directly
  return <Outlet />
}
