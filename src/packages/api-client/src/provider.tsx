import { createContext, useContext } from 'react';

import type { ApiClient } from './client';

const ApiClientContext = createContext<ApiClient | null>(null);

interface ApiClientProviderProps {
  client: ApiClient;
  children: React.ReactNode;
}

export function ApiClientProvider({ client, children }: ApiClientProviderProps) {
  return <ApiClientContext value={client}>{children}</ApiClientContext>;
}

export function useApiClient(): ApiClient {
  const client = useContext(ApiClientContext);
  if (!client) {
    throw new Error(
      'useApiClient must be used within an ApiClientProvider. ' +
        'Wrap your app with <ApiClientProvider client={apiClient}>.',
    );
  }
  return client;
}
