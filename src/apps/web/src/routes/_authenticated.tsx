import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router';
import { YStack, Spinner } from 'tamagui';

import { useAuth } from '@/providers/AuthProvider';

export const Route = createFileRoute('/_authenticated')({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <YStack
        flex={1}
        alignItems="center"
        justifyContent="center"
        role="status"
        aria-label="Loading"
      >
        <Spinner size="large" color="$brandPrimary" />
      </YStack>
    );
  }

  if (!isAuthenticated) {
    navigate({ to: '/login' });
    return null;
  }

  return (
    <YStack flex={1} tag="main" role="main">
      <Outlet />
    </YStack>
  );
}
