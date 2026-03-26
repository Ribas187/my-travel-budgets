import { useEffect } from 'react';
import { TamaguiProvider } from 'tamagui';
import { QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { config } from '@repo/ui';
import { ApiClientProvider } from '@repo/api-client';

import { queryClient } from './queryClient';
import i18n from './i18n';
import { AuthProvider, useAuth } from './providers/AuthProvider';
import { apiClient, setTokenGetter, setOnUnauthorized } from './apiClient';
import { routeTree } from './routeTree.gen';

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

function AuthWiring({ children }: { children: React.ReactNode }) {
  const { getToken, logout } = useAuth();

  useEffect(() => {
    setTokenGetter(getToken);
    setOnUnauthorized(() => {
      logout();
      router.navigate({ to: '/login' });
    });
  }, [getToken, logout]);

  return <>{children}</>;
}

export function App() {
  return (
    <TamaguiProvider config={config} defaultTheme="light">
      <ApiClientProvider client={apiClient}>
        <QueryClientProvider client={queryClient}>
          <I18nextProvider i18n={i18n}>
            <AuthProvider>
              <AuthWiring>
                <RouterProvider router={router} />
              </AuthWiring>
            </AuthProvider>
          </I18nextProvider>
        </QueryClientProvider>
      </ApiClientProvider>
    </TamaguiProvider>
  );
}
