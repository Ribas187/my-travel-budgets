import type { ExtractedReceipt } from '@repo/core';

import type {
  CreateTravelInput,
  UpdateTravelInput,
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateExpenseInput,
  UpdateExpenseInput,
  AddMemberInput,
  AuthSession,
  Travel,
  TravelDetail,
  TravelMember,
  Category,
  Expense,
  ExpenseFilters,
  DashboardData,
  UserMe,
  ApiError,
} from './types';

export interface ApiClientConfig {
  baseUrl: string;
  getToken: () => string | null;
}

export class ApiClient {
  private baseUrl: string;
  private getToken: () => string | null;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.getToken = config.getToken;
  }

  private async request<T>(
    method: string,
    path: string,
    options?: {
      body?: unknown;
      auth?: boolean;
      query?: Record<string, string | number | undefined>;
    },
  ): Promise<T> {
    const { body, auth = true, query } = options ?? {};

    let url = `${this.baseUrl}${path}`;

    if (query) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
          params.set(key, String(value));
        }
      }
      const qs = params.toString();
      if (qs) {
        url += `?${qs}`;
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (auth) {
      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      let errorBody: { message?: string; errors?: string[] } = {};
      try {
        errorBody = await response.json();
      } catch {
        // response body is not JSON
      }

      const apiError: ApiError = {
        statusCode: response.status,
        message: errorBody.message ?? response.statusText,
        errors: errorBody.errors,
      };
      throw apiError;
    }

    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }

  // Auth methods (no auth header required)

  readonly auth = {
    requestMagicLink: (email: string): Promise<void> =>
      this.request('POST', '/auth/magic-link', { body: { email }, auth: false }),

    verify: (token: string): Promise<AuthSession> =>
      this.request('GET', `/auth/verify`, { auth: false, query: { token } }),

    requestPin: (email: string): Promise<void> =>
      this.request('POST', '/auth/login-pin', { body: { email }, auth: false }),

    verifyPin: (email: string, pin: string): Promise<AuthSession> =>
      this.request('POST', '/auth/verify-pin', { body: { email, pin }, auth: false }),
  };

  // Travels methods

  readonly travels = {
    list: (): Promise<Travel[]> => this.request('GET', '/travels'),

    get: (id: string): Promise<TravelDetail> => this.request('GET', `/travels/${id}`),

    create: (data: CreateTravelInput): Promise<Travel> =>
      this.request('POST', '/travels', { body: data }),

    update: (id: string, data: UpdateTravelInput): Promise<Travel> =>
      this.request('PATCH', `/travels/${id}`, { body: data }),

    delete: (id: string): Promise<void> => this.request('DELETE', `/travels/${id}`),
  };

  // Members methods

  readonly members = {
    add: (travelId: string, data: AddMemberInput): Promise<TravelMember> =>
      this.request('POST', `/travels/${travelId}/members`, { body: data }),

    remove: (travelId: string, memberId: string): Promise<void> =>
      this.request('DELETE', `/travels/${travelId}/members/${memberId}`),
  };

  // Expenses methods

  readonly expenses = {
    list: (travelId: string, filters?: ExpenseFilters): Promise<Expense[]> =>
      this.request('GET', `/travels/${travelId}/expenses`, {
        query: filters
          ? {
              categoryId: filters.categoryId,
              memberId: filters.memberId,
              startDate: filters.startDate,
              endDate: filters.endDate,
              page: filters.page,
              limit: filters.limit,
            }
          : undefined,
      }),

    create: (travelId: string, data: CreateExpenseInput): Promise<Expense> =>
      this.request('POST', `/travels/${travelId}/expenses`, { body: data }),

    update: (travelId: string, expenseId: string, data: UpdateExpenseInput): Promise<Expense> =>
      this.request('PATCH', `/travels/${travelId}/expenses/${expenseId}`, { body: data }),

    delete: (travelId: string, expenseId: string): Promise<void> =>
      this.request('DELETE', `/travels/${travelId}/expenses/${expenseId}`),
  };

  // Categories methods

  readonly categories = {
    create: (travelId: string, data: CreateCategoryInput): Promise<Category> =>
      this.request('POST', `/travels/${travelId}/categories`, { body: data }),

    update: (travelId: string, catId: string, data: UpdateCategoryInput): Promise<Category> =>
      this.request('PATCH', `/travels/${travelId}/categories/${catId}`, { body: data }),

    delete: (travelId: string, catId: string): Promise<void> =>
      this.request('DELETE', `/travels/${travelId}/categories/${catId}`),
  };

  // Dashboard methods

  readonly dashboard = {
    get: (travelId: string): Promise<DashboardData> =>
      this.request('GET', `/travels/${travelId}/dashboard`),
  };

  // Onboarding methods

  readonly onboarding = {
    complete: (): Promise<void> =>
      this.request('PATCH', '/onboarding/complete'),

    reset: (): Promise<void> =>
      this.request('PATCH', '/onboarding/reset'),

    dismissTip: (tipId: string): Promise<void> =>
      this.request('PATCH', `/onboarding/tips/${tipId}/dismiss`),

    resetTips: (): Promise<void> =>
      this.request('PATCH', '/onboarding/tips/reset'),
  };

  // Users methods

  readonly users = {
    getMe: (): Promise<UserMe> => this.request('GET', '/users/me'),

    updateMe: (data: { name?: string }): Promise<UserMe> =>
      this.request('PATCH', '/users/me', { body: data }),

    setMainTravel: (travelId: string | null): Promise<UserMe> =>
      this.request('PATCH', '/users/me/main-travel', { body: { travelId } }),

    uploadAvatar: async (file: Blob): Promise<UserMe> => {
      const formData = new FormData();
      formData.append('file', file);

      const headers: Record<string, string> = {};
      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/users/me/avatar`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        let errorBody: { message?: string; errors?: string[] } = {};
        try {
          errorBody = await response.json();
        } catch {
          // response body is not JSON
        }
        const apiError: ApiError = {
          statusCode: response.status,
          message: errorBody.message ?? response.statusText,
          errors: errorBody.errors,
        };
        throw apiError;
      }

      return response.json() as Promise<UserMe>;
    },

    removeAvatar: (): Promise<UserMe> =>
      this.request('DELETE', '/users/me/avatar'),
  };

  // Receipts methods

  readonly receipts = {
    extract: async (
      travelId: string,
      file: Blob,
      options?: { signal?: AbortSignal },
    ): Promise<ExtractedReceipt> => {
      const formData = new FormData();
      formData.append('image', file);

      const headers: Record<string, string> = {};
      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${this.baseUrl}/travels/${travelId}/receipts/extract`,
        {
          method: 'POST',
          headers,
          body: formData,
          signal: options?.signal,
        },
      );

      if (!response.ok) {
        let errorBody: { message?: string; errors?: string[] } = {};
        try {
          errorBody = await response.json();
        } catch {
          // response body is not JSON
        }
        const apiError: ApiError = {
          statusCode: response.status,
          message: errorBody.message ?? response.statusText,
          errors: errorBody.errors,
        };
        throw apiError;
      }

      return response.json() as Promise<ExtractedReceipt>;
    },
  };
}
