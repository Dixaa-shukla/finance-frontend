import { axiosClient } from '@/api/axiosClient';
import type {
  ProcessDueResponse,
  RecurringTransactionRequest,
  RecurringTransactionResponse,
} from '@/types/recurring';

export const recurringService = {
  /**
   * GET /api/v1/recurring-transactions/user/{userId}
   */
  getByUserId: async (userId: number): Promise<RecurringTransactionResponse[]> => {
    const { data } = await axiosClient.get<RecurringTransactionResponse[]>(
      `/recurring-transactions/user/${userId}`
    );
    return data;
  },

  /** GET /api/v1/recurring-transactions/{id} — 404 if the id is unknown. */
  getById: async (id: number): Promise<RecurringTransactionResponse> => {
    const { data } = await axiosClient.get<RecurringTransactionResponse>(
      `/recurring-transactions/${id}`
    );
    return data;
  },

  /**
   * POST /api/v1/recurring-transactions — 201 Created.
   */
  create: async (
    payload: RecurringTransactionRequest
  ): Promise<RecurringTransactionResponse> => {
    const { data } = await axiosClient.post<RecurringTransactionResponse>(
      '/recurring-transactions',
      payload
    );
    return data;
  },

  /**
   * PUT /api/v1/recurring-transactions/{id}
   */
  update: async (
    id: number,
    payload: RecurringTransactionRequest
  ): Promise<RecurringTransactionResponse> => {
    const { data } = await axiosClient.put<RecurringTransactionResponse>(
      `/recurring-transactions/${id}`,
      payload
    );
    return data;
  },

  /**
   * PATCH /api/v1/recurring-transactions/{id}/pause — 200 with the updated rule.
   */
  pause: async (id: number): Promise<RecurringTransactionResponse> => {
    const { data } = await axiosClient.patch<RecurringTransactionResponse>(
      `/recurring-transactions/${id}/pause`
    );
    return data;
  },

  /** PATCH /api/v1/recurring-transactions/{id}/resume — sets active = true. */
  resume: async (id: number): Promise<RecurringTransactionResponse> => {
    const { data } = await axiosClient.patch<RecurringTransactionResponse>(
      `/recurring-transactions/${id}/resume`
    );
    return data;
  },

  /**
   * DELETE /api/v1/recurring-transactions/{id} — 204, 404 if the id is unknown.
   */
  remove: async (id: number): Promise<void> => {
    await axiosClient.delete(`/recurring-transactions/${id}`);
  },

  /**
   * POST /api/v1/recurring-transactions/process-due — 200 {"transactionsGenerated": n}
   */
  processDue: async (): Promise<ProcessDueResponse> => {
    const { data } = await axiosClient.post<ProcessDueResponse>(
      '/recurring-transactions/process-due'
    );
    return data;
  },


};
