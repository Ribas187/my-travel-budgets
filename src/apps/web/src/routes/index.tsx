import { createFileRoute, redirect } from '@tanstack/react-router';
import { queryKeys } from '@repo/api-client';
import type { UserMe, Travel } from '@repo/api-client';

export const Route = createFileRoute('/')({
  beforeLoad: async ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/travels' });
    }

    let user: UserMe;
    let travels: Travel[];

    try {
      user =
        context.queryClient.getQueryData<UserMe>(queryKeys.users.me) ??
        (await context.queryClient.fetchQuery({
          queryKey: queryKeys.users.me,
          queryFn: () => context.apiClient.users.getMe(),
        }));

      if (!user?.mainTravelId) {
        throw redirect({ to: '/travels' });
      }

      travels =
        context.queryClient.getQueryData<Travel[]>(queryKeys.travels.all) ??
        (await context.queryClient.fetchQuery({
          queryKey: queryKeys.travels.all,
          queryFn: () => context.apiClient.travels.list(),
        }));
    } catch (error) {
      if (error && typeof error === 'object' && 'to' in (error as object)) {
        throw error;
      }
      throw redirect({ to: '/travels' });
    }

    const mainTravelId = user.mainTravelId;
    const isAccessible = travels.some((t) => t.id === mainTravelId);
    if (!isAccessible) {
      throw redirect({ to: '/travels' });
    }

    throw redirect({
      to: '/travels/$travelId',
      params: { travelId: mainTravelId! },
    });
  },
});
