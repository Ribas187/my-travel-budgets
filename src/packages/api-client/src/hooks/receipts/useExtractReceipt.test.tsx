// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ApiClient } from '../../client';
import { ApiClientProvider } from '../../provider';

import { useExtractReceipt } from './useExtractReceipt';

const BASE_URL = 'https://api.mybudget.cards';
const TEST_TOKEN = 'test-jwt-token';
const TRAVEL_ID = 't1';

const VALID_RESPONSE = { total: 42.5, date: '2026-05-05', merchant: 'Café Central' };

function createClient(getToken: () => string | null = () => TEST_TOKEN) {
  return new ApiClient({ baseUrl: BASE_URL, getToken });
}

function mockFetchSuccess(data: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    headers: new Headers({ 'content-length': '1' }),
    json: () => Promise.resolve(data),
  });
}

function mockFetchError(status: number, body: { message?: string; errors?: string[] }) {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    statusText: `Error ${status}`,
    json: () => Promise.resolve(body),
  });
}

function createTestWrapper(apiClient: ApiClient) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return {
    queryClient: qc,
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <ApiClientProvider client={apiClient}>
        <QueryClientProvider client={qc}>{children}</QueryClientProvider>
      </ApiClientProvider>
    ),
  };
}

describe('client.receipts.extract', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sends POST to /travels/:travelId/receipts/extract', async () => {
    const fetchMock = mockFetchSuccess(VALID_RESPONSE);
    globalThis.fetch = fetchMock;

    const client = createClient();
    await client.receipts.extract(TRAVEL_ID, new Blob(['x'], { type: 'image/jpeg' }));

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE_URL}/travels/${TRAVEL_ID}/receipts/extract`);
    expect(init.method).toBe('POST');
  });

  it('attaches Authorization header when token exists', async () => {
    const fetchMock = mockFetchSuccess(VALID_RESPONSE);
    globalThis.fetch = fetchMock;

    const client = createClient(() => TEST_TOKEN);
    await client.receipts.extract(TRAVEL_ID, new Blob(['x'], { type: 'image/jpeg' }));

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers['Authorization']).toBe(`Bearer ${TEST_TOKEN}`);
  });

  it('omits Authorization header when token is null', async () => {
    const fetchMock = mockFetchSuccess(VALID_RESPONSE);
    globalThis.fetch = fetchMock;

    const client = createClient(() => null);
    await client.receipts.extract(TRAVEL_ID, new Blob(['x'], { type: 'image/jpeg' }));

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers['Authorization']).toBeUndefined();
  });

  it('sends multipart/form-data body with field name "image"', async () => {
    const fetchMock = mockFetchSuccess(VALID_RESPONSE);
    globalThis.fetch = fetchMock;

    const blob = new Blob(['receipt-bytes'], { type: 'image/jpeg' });
    const client = createClient();
    await client.receipts.extract(TRAVEL_ID, blob);

    const [, init] = fetchMock.mock.calls[0];
    expect(init.body).toBeInstanceOf(FormData);
    const fd = init.body as FormData;
    const imagePart = fd.get('image');
    expect(imagePart).not.toBeNull();
    // The browser fetch (and FormData polyfill in jsdom) preserves the appended Blob.
    expect(imagePart).toBeInstanceOf(Blob);
    expect((imagePart as Blob).type).toBe('image/jpeg');
  });

  it('does NOT set Content-Type manually (browser sets boundary)', async () => {
    const fetchMock = mockFetchSuccess(VALID_RESPONSE);
    globalThis.fetch = fetchMock;

    const client = createClient();
    await client.receipts.extract(TRAVEL_ID, new Blob(['x'], { type: 'image/jpeg' }));

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers['Content-Type']).toBeUndefined();
  });

  it('returns the parsed ExtractedReceipt on success', async () => {
    const fetchMock = mockFetchSuccess(VALID_RESPONSE);
    globalThis.fetch = fetchMock;

    const client = createClient();
    const result = await client.receipts.extract(
      TRAVEL_ID,
      new Blob(['x'], { type: 'image/jpeg' }),
    );

    expect(result).toEqual(VALID_RESPONSE);
  });

  it('maps a 422 response to ApiError with the upstream message', async () => {
    const fetchMock = mockFetchError(422, {
      message: 'Receipt content could not be extracted.',
    });
    globalThis.fetch = fetchMock;

    const client = createClient();

    await expect(
      client.receipts.extract(TRAVEL_ID, new Blob(['x'], { type: 'image/jpeg' })),
    ).rejects.toMatchObject({
      statusCode: 422,
      message: 'Receipt content could not be extracted.',
    });
  });

  it('maps a 502 response to ApiError', async () => {
    const fetchMock = mockFetchError(502, { message: 'Upstream vision provider failed' });
    globalThis.fetch = fetchMock;

    const client = createClient();

    await expect(
      client.receipts.extract(TRAVEL_ID, new Blob(['x'], { type: 'image/jpeg' })),
    ).rejects.toMatchObject({
      statusCode: 502,
      message: 'Upstream vision provider failed',
    });
  });

  it('handles non-JSON error bodies by falling back to statusText', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
      json: () => Promise.reject(new Error('Not JSON')),
    });

    const client = createClient();

    await expect(
      client.receipts.extract(TRAVEL_ID, new Blob(['x'], { type: 'image/jpeg' })),
    ).rejects.toMatchObject({
      statusCode: 503,
      message: 'Service Unavailable',
    });
  });
});

describe('useExtractReceipt', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('mutates with the file and resolves with the extracted receipt', async () => {
    globalThis.fetch = mockFetchSuccess(VALID_RESPONSE);
    const client = createClient();
    const extractSpy = vi.spyOn(client.receipts, 'extract');
    const { wrapper } = createTestWrapper(client);

    const { result } = renderHook(() => useExtractReceipt(TRAVEL_ID), { wrapper });

    const blob = new Blob(['x'], { type: 'image/jpeg' });
    result.current.mutate(blob);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(extractSpy).toHaveBeenCalledWith(
      TRAVEL_ID,
      blob,
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(result.current.data).toEqual(VALID_RESPONSE);
  });

  it('exposes a cancel() that aborts the in-flight request', async () => {
    let abortedFromFetch = false;
    globalThis.fetch = vi.fn(async (_url: any, init: any) => {
      const signal: AbortSignal | undefined = init?.signal;
      // Hang until aborted to simulate an in-flight extraction.
      return await new Promise((_resolve, reject) => {
        signal?.addEventListener('abort', () => {
          abortedFromFetch = true;
          const err = new Error('Aborted');
          (err as any).name = 'AbortError';
          reject(err);
        });
      });
    }) as any;

    const client = createClient();
    const { wrapper } = createTestWrapper(client);
    const { result } = renderHook(() => useExtractReceipt(TRAVEL_ID), { wrapper });

    const blob = new Blob(['x'], { type: 'image/jpeg' });
    result.current.mutate(blob);

    await waitFor(() => expect(result.current.isPending).toBe(true));

    result.current.cancel();

    await waitFor(() => expect(abortedFromFetch).toBe(true));
  });

  it('surfaces ApiError on a 422 server response', async () => {
    globalThis.fetch = mockFetchError(422, { message: 'unreadable' });
    const client = createClient();
    const { wrapper } = createTestWrapper(client);

    const { result } = renderHook(() => useExtractReceipt(TRAVEL_ID), { wrapper });

    result.current.mutate(new Blob(['x'], { type: 'image/jpeg' }));

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toMatchObject({
      statusCode: 422,
      message: 'unreadable',
    });
  });

  it('surfaces ApiError on a 502 server response', async () => {
    globalThis.fetch = mockFetchError(502, { message: 'upstream' });
    const client = createClient();
    const { wrapper } = createTestWrapper(client);

    const { result } = renderHook(() => useExtractReceipt(TRAVEL_ID), { wrapper });

    result.current.mutate(new Blob(['x'], { type: 'image/jpeg' }));

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toMatchObject({
      statusCode: 502,
      message: 'upstream',
    });
  });

  it('does not invalidate any query keys on success', async () => {
    globalThis.fetch = mockFetchSuccess(VALID_RESPONSE);
    const client = createClient();
    const { wrapper, queryClient } = createTestWrapper(client);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useExtractReceipt(TRAVEL_ID), { wrapper });

    result.current.mutate(new Blob(['x'], { type: 'image/jpeg' }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
