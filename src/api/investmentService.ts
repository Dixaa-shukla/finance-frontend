import { axiosClient } from '@/api/axiosClient';
import type {
  InvestmentRequest,
  InvestmentResponse,
  InvestmentSummaryResponse,
  InvestmentType,
} from '@/types/investment';

export const investmentService = {
  /**
   * GET /api/v1/investments/user/{userId}?type=...
   */
  getByUserId: async (
    userId: number,
    type?: InvestmentType | null
  ): Promise<InvestmentResponse[]> => {
    const { data } = await axiosClient.get<InvestmentResponse[]>(
      `/investments/user/${userId}`,
     
      type ? { params: { type } } : undefined
    );
    return data;
  },

  /**
   * GET /api/v1/investments/user/{userId}/summary
   */
  getSummary: async (userId: number): Promise<InvestmentSummaryResponse> => {
    const { data } = await axiosClient.get<InvestmentSummaryResponse>(
      `/investments/user/${userId}/summary`
    );
    return data;
  },

  /** GET /api/v1/investments/{id} */
  getById: async (id: number): Promise<InvestmentResponse> => {
    const { data } = await axiosClient.get<InvestmentResponse>(
      `/investments/${id}`
    );
    return data;
  },

  /** POST /api/v1/investments -> 201 Created */
  create: async (payload: InvestmentRequest): Promise<InvestmentResponse> => {
    const { data } = await axiosClient.post<InvestmentResponse>(
      '/investments',
      payload
    );
    return data;
  },

  /**
   * PUT /api/v1/investments/{id}
   */
  update: async (
    id: number,
    payload: InvestmentRequest
  ): Promise<InvestmentResponse> => {
    const { data } = await axiosClient.put<InvestmentResponse>(
      `/investments/${id}`,
      payload
    );
    return data;
  },

  /** DELETE /api/v1/investments/{id} -> 204 No Content */
  remove: async (id: number): Promise<void> => {
    await axiosClient.delete(`/investments/${id}`);
  },
};
