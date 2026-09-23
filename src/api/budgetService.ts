import { axiosClient } from '@/api/axiosClient';
import type { BudgetRequest, BudgetResponse } from '@/types/budget';

export const budgetService = {
  /**
   * GET /api/v1/budgets/user/{userId}
   */
  getByUserId: async (userId: number): Promise<BudgetResponse[]> => {
    const { data } = await axiosClient.get<BudgetResponse[]>(
      `/budgets/user/${userId}`
    );
    return data;
  },

  /**
 * GET /api/v1/budgets/user/{userId}/alerts
 *
 * Returns only budgets where the alert threshold is reached.
 * The screen does not call this endpoint because each budget already includes
 * its alert status, avoiding an extra request to make  data consistent.
 */
  getAlerts: async (userId: number): Promise<BudgetResponse[]> => {
    const { data } = await axiosClient.get<BudgetResponse[]>(
      `/budgets/user/${userId}/alerts`
    );
    return data;
  },

  /** GET /api/v1/budgets/{id} */
  getById: async (id: number): Promise<BudgetResponse> => {
    const { data } = await axiosClient.get<BudgetResponse>(`/budgets/${id}`);
    return data;
  },

  /**
   * POST /api/v1/budgets — 201 Created.
   */
  create: async (payload: BudgetRequest): Promise<BudgetResponse> => {
    const { data } = await axiosClient.post<BudgetResponse>(
      '/budgets',
      payload
    );
    return data;
  },

  /** PUT /api/v1/budgets/{id} — replaces every field, same validation as create. */
  update: async (
    id: number,
    payload: BudgetRequest
  ): Promise<BudgetResponse> => {
    const { data } = await axiosClient.put<BudgetResponse>(
      `/budgets/${id}`,
      payload
    );
    return data;
  },

  /** DELETE /api/v1/budgets/{id} — 204 No Content, 404 if the id is unknown. */
  remove: async (id: number): Promise<void> => {
    await axiosClient.delete(`/budgets/${id}`);
  },
};
