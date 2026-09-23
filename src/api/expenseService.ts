import { axiosClient } from '@/api/axiosClient';
import type {
  ExpenseFilters,
  ExpenseRequest,
  ExpenseResponse,
  PageResponse,
} from '@/types/expense';

/**
 * Matches the ExpenseController routes exactly.
 * All six routes exist in the backend.
 */
export const expenseService = {
  /** GET /api/v1/expenses/user/{userId} — every expense, newest first. */
  getByUserId: async (userId: number): Promise<ExpenseResponse[]> => {
    const { data } = await axiosClient.get<ExpenseResponse[]>(
      `/expenses/user/${userId}`
    );
    return data;
  },

  /** GET /api/v1/expenses/{id} */
  getById: async (id: number): Promise<ExpenseResponse> => {
    const { data } = await axiosClient.get<ExpenseResponse>(`/expenses/${id}`);
    return data;
  },

  /**
   * GET /api/v1/expenses/user/{userId}/search
   */
  search: async (
    userId: number,
    filters: ExpenseFilters,
    page: number,
    size = 10
  ): Promise<PageResponse<ExpenseResponse>> => {
    const params: Record<string, string | number> = {
      page,
      size,
      // The controller defaults to sort=expenseDate ASC; a spending list reads
      // newest-first, so ask for DESC explicitly.
      sort: 'expenseDate,desc',
    };

    for (const [key, value] of Object.entries(filters)) {
      if (value !== '') params[key] = value;
    }

    const { data } = await axiosClient.get<PageResponse<ExpenseResponse>>(
      `/expenses/user/${userId}/search`,
      { params }
    );
    return data;
  },

  /** POST /api/v1/expenses — 201 Created */
  create: async (payload: ExpenseRequest): Promise<ExpenseResponse> => {
    const { data } = await axiosClient.post<ExpenseResponse>(
      '/expenses',
      payload
    );
    return data;
  },

  /** PUT /api/v1/expenses/{id} */
  update: async (
    id: number,
    payload: ExpenseRequest
  ): Promise<ExpenseResponse> => {
    const { data } = await axiosClient.put<ExpenseResponse>(
      `/expenses/${id}`,
      payload
    );
    return data;
  },

  /** DELETE /api/v1/expenses/{id} — 204 No Content */
  remove: async (id: number): Promise<void> => {
    await axiosClient.delete(`/expenses/${id}`);
  },
};
