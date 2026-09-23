import { axiosClient } from '@/api/axiosClient';
import type {
  IncomeFilters,
  IncomeRequest,
  IncomeResponse,
  PageResponse,
} from '@/types/income';

/**
 * Maps 1:1 to com.finance_backend.income.controller.IncomeController.
 * All six routes below exist there .
 */
export const incomeService = {
  /** GET /api/v1/incomes/user/{userId} — the complete list, unpaginated. */
  getByUserId: async (userId: number): Promise<IncomeResponse[]> => {
    const { data } = await axiosClient.get<IncomeResponse[]>(
      `/incomes/user/${userId}`
    );
    return data;
  },

  /** GET /api/v1/incomes/{id} */
  getById: async (id: number): Promise<IncomeResponse> => {
    const { data } = await axiosClient.get<IncomeResponse>(`/incomes/${id}`);
    return data;
  },

  /**
   * GET /api/v1/incomes/user/{userId}/search
   */
  search: async (
    userId: number,
    filters: IncomeFilters,
    page: number,
    size = 10
  ): Promise<PageResponse<IncomeResponse>> => {
    const params: Record<string, string | number> = {
      page,
      size,
     // @PageableDefault sorts by incomeDate ASC, but the income list should show
// newest entries first, so DESC is set explicitly.
      sort: 'incomeDate,desc',
    };

    for (const [key, value] of Object.entries(filters)) {
      if (value !== '') params[key] = value;
    }

    const { data } = await axiosClient.get<PageResponse<IncomeResponse>>(
      `/incomes/user/${userId}/search`,
      { params }
    );
    return data;
  },

  /** POST /api/v1/incomes — 201 Created */
  create: async (payload: IncomeRequest): Promise<IncomeResponse> => {
    const { data } = await axiosClient.post<IncomeResponse>(
      '/incomes',
      payload
    );
    return data;
  },

  /** PUT /api/v1/incomes/{id} */
  update: async (
    id: number,
    payload: IncomeRequest
  ): Promise<IncomeResponse> => {
    const { data } = await axiosClient.put<IncomeResponse>(
      `/incomes/${id}`,
      payload
    );
    return data;
  },

  /** DELETE /api/v1/incomes/{id} — 204 No Content */
  remove: async (id: number): Promise<void> => {
    await axiosClient.delete(`/incomes/${id}`);
  },
};
