import { createFileRoute, redirect, isRedirect } from '@tanstack/react-router';
import { queryKeys } from '@repo/api-client';

import { apiClient } from '@/apiClient';
import { queryClient } from '@/queryClient';

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    try {
      const user = await queryClient.ensureQueryData({
        queryKey: queryKeys.users.me,
        queryFn: () => apiClient.users.getMe(),
      });

      if (user.mainTravelId) {
        // Verify the travel is still accessible before redirecting
        const travels = await queryClient.ensureQueryData({
          queryKey: queryKeys.travels.all,
          queryFn: () => apiClient.travels.list(),
        });

        const isAccessible = travels.some((t) => t.id === user.mainTravelId);

        if (isAccessible) {
          throw redirect({
            to: '/travels/$travelId/summary',
            params: { travelId: user.mainTravelId },
          });
        }
      }
    } catch (error) {
      // Re-throw redirect errors (TanStack Router redirects are Response objects)
      if (isRedirect(error)) {
        throw error;
      }
      // For any other error (auth failure, network issue), fall through to /travels
    }

    throw redirect({ to: '/travels' });
  },
});
