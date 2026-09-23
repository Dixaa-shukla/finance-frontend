import { axiosClient } from '@/api/axiosClient';
import type {
  GoalContributionRequest,
  GoalRequest,
  GoalResponse,
} from '@/types/goal';

export const goalService = {
  /**
   * GET /api/v1/goals/user/{userId}
   */
  getByUserId: async (userId: number): Promise<GoalResponse[]> => {
    const { data } = await axiosClient.get<GoalResponse[]>(
      `/goals/user/${userId}`
    );
    return data;
  },

  /** GET /api/v1/goals/{id} */
  getById: async (id: number): Promise<GoalResponse> => {
    const { data } = await axiosClient.get<GoalResponse>(`/goals/${id}`);
    return data;
  },

  /**
   * POST /api/v1/goals — 201 Created.
   */
  create: async (payload: GoalRequest): Promise<GoalResponse> => {
    const { data } = await axiosClient.post<GoalResponse>('/goals', payload);
    return data;
  },

  /**
   * PUT /api/v1/goals/{id}
   */
  update: async (id: number, payload: GoalRequest): Promise<GoalResponse> => {
    const { data } = await axiosClient.put<GoalResponse>(`/goals/${id}`, payload);
    return data;
  },

  /**
   * POST /api/v1/goals/{id}/contribute — 200 with the updated goal.
   */
  contribute: async (
    id: number,
    payload: GoalContributionRequest
  ): Promise<GoalResponse> => {
    const { data } = await axiosClient.post<GoalResponse>(
      `/goals/${id}/contribute`,
      payload
    );
    return data;
  },

  /** DELETE /api/v1/goals/{id} — 204 No Content, 404 if the id is unknown. */
  remove: async (id: number): Promise<void> => {
    await axiosClient.delete(`/goals/${id}`);
  },
};
