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

const router = createRouter({
  routeTree,
  context: {
    auth: {
      isAuthenticated: false,
      getToken: () => null,
    },
    queryClient,
    apiClient,
  },
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

function InnerApp() {
  const auth = useAuth();

  useEffect(() => {
    setTokenGetter(auth.getToken);
    setOnUnauthorized(() => {
      auth.logout();
      router.navigate({ to: '/login' });
    });
  }, [auth]);

  return (
    <RouterProvider
      router={router}
      context={{
        auth: {
          isAuthenticated: auth.isAuthenticated,
          getToken: auth.getToken,
        },
        queryClient,
        apiClient,
      }}
    />
  );
}

export function App() {
  return (
    <TamaguiProvider config={config} defaultTheme="light">
      <ApiClientProvider client={apiClient}>
        <QueryClientProvider client={queryClient}>
          <I18nextProvider i18n={i18n}>
            <AuthProvider>
              <InnerApp />
            </AuthProvider>
          </I18nextProvider>
        </QueryClientProvider>
      </ApiClientProvider>
    </TamaguiProvider>
  );
}
