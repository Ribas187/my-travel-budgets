import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import type { ApiClient } from '@repo/api-client';

import { ToastContainer } from '@/lib/ToastContainer';

export interface RouterContext {
  auth: {
    isAuthenticated: boolean;
    getToken: () => string | null;
  };
  queryClient: QueryClient;
  apiClient: ApiClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});

function RootLayout() {
  return (
    <>
      <Outlet />
      <ToastContainer />
    </>
  );
}
