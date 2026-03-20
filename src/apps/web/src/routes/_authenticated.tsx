import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/providers/AuthProvider'
import { YStack, Spinner } from 'tamagui'

export const Route = createFileRoute('/_authenticated')({
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center">
        <Spinner size="large" color="$brandPrimary" />
      </YStack>
    )
  }

  if (!isAuthenticated) {
    navigate({ to: '/login' })
    return null
  }

  return <Outlet />
}
