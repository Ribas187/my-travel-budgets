// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';

import { ApiClient } from '../client';
import { ApiClientProvider, useApiClient } from '../provider';

const mockClient = new ApiClient({
  baseUrl: 'http://localhost:3000',
  getToken: () => null,
});

describe('ApiClientProvider', () => {
  it('useApiClient() throws when used outside ApiClientProvider', () => {
    expect(() => {
      renderHook(() => useApiClient());
    }).toThrow('useApiClient must be used within an ApiClientProvider');
  });

  it('useApiClient() returns the provided ApiClient instance inside the provider', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ApiClientProvider client={mockClient}>{children}</ApiClientProvider>
    );

    const { result } = renderHook(() => useApiClient(), { wrapper });

    expect(result.current).toBe(mockClient);
  });
});
