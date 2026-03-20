import { createRootRoute, Outlet } from '@tanstack/react-router';

import { ToastContainer } from '@/lib/ToastContainer';

export const Route = createRootRoute({
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
