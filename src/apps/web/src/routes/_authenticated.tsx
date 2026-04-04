import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { YStack } from 'tamagui';

import { queryKeys } from '@repo/api-client';
import type { UserMe } from '@repo/api-client';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' });
    }

    // Try to get user from cache, otherwise fetch
    let user = context.queryClient.getQueryData<UserMe>(queryKeys.users.me);
    if (!user) {
      try {
        user = await context.queryClient.fetchQuery({
          queryKey: queryKeys.users.me,
          queryFn: () => context.apiClient.users.getMe(),
        });
      } catch {
        // If fetch fails, allow through — don't block navigation
        return { user: null };
      }
    }

    if (
      user &&
      !user.onboardingCompletedAt &&
      location.pathname !== '/onboarding'
    ) {
      throw redirect({ to: '/onboarding' });
    }

    return { user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <YStack flex={1} tag="main" role="main">
      <Outlet />
    </YStack>
  );
}
