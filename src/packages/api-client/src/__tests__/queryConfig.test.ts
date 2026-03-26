import { describe, it, expect } from 'vitest';
import { QueryClient } from '@tanstack/react-query';

import { defaultQueryOptions, createDefaultQueryClient } from '../queryConfig';

describe('defaultQueryOptions', () => {
  it('has staleTime of 2 minutes', () => {
    expect(defaultQueryOptions.queries?.staleTime).toBe(1000 * 60 * 2);
  });

  it('has query retry of 1', () => {
    expect(defaultQueryOptions.queries?.retry).toBe(1);
  });

  it('has mutation retry of 0', () => {
    expect(defaultQueryOptions.mutations?.retry).toBe(0);
  });

  it('has refetchOnWindowFocus disabled', () => {
    expect(defaultQueryOptions.queries?.refetchOnWindowFocus).toBe(false);
  });
});

describe('createDefaultQueryClient', () => {
  it('returns a QueryClient instance', () => {
    const client = createDefaultQueryClient();
    expect(client).toBeInstanceOf(QueryClient);
  });

  it('has the correct default options', () => {
    const client = createDefaultQueryClient();
    const defaults = client.getDefaultOptions();

    expect(defaults.queries?.staleTime).toBe(1000 * 60 * 2);
    expect(defaults.queries?.retry).toBe(1);
    expect(defaults.queries?.refetchOnWindowFocus).toBe(false);
    expect(defaults.mutations?.retry).toBe(0);
  });
});

describe('overriding defaults', () => {
  it('allows overriding individual defaults by spreading', () => {
    const customOptions = {
      ...defaultQueryOptions,
      queries: {
        ...defaultQueryOptions.queries,
        staleTime: 5000,
      },
    };

    const client = new QueryClient({ defaultOptions: customOptions });
    const defaults = client.getDefaultOptions();

    expect(defaults.queries?.staleTime).toBe(5000);
    expect(defaults.queries?.retry).toBe(1);
    expect(defaults.queries?.refetchOnWindowFocus).toBe(false);
    expect(defaults.mutations?.retry).toBe(0);
  });
});
