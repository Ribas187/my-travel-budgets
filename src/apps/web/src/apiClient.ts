import { ApiClient } from '@repo/api-client';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

let tokenGetter: () => string | null = () => null;
let onUnauthorized: () => void = () => {};

export function setTokenGetter(getter: () => string | null) {
  tokenGetter = getter;
}

export function setOnUnauthorized(handler: () => void) {
  onUnauthorized = handler;
}

export const apiClient = new ApiClient({
  baseUrl: API_BASE_URL,
  getToken: () => tokenGetter(),
});

// Wrap the original request method to intercept 401 responses
const originalFetch = globalThis.fetch;
globalThis.fetch = async (...args: Parameters<typeof fetch>) => {
  const response = await originalFetch(...args);

  if (response.status === 401) {
    const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
    // Don't intercept auth endpoints
    if (!url.includes('/auth/')) {
      onUnauthorized();
    }
  }

  return response;
};
