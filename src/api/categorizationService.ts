import { axiosClient } from '@/api/axiosClient';
import type { CategorizationResponse } from '@/types/categorization';

export const categorizationService = {
  async suggest(userId: number, description: string): Promise<CategorizationResponse> {
    const { data } = await axiosClient.post<CategorizationResponse>('/ai/categorization/suggest', { userId, description });
    return data;
  },
  async confirm(userId: number, merchant: string, confirmedCategory: string): Promise<CategorizationResponse> {
    const { data } = await axiosClient.post<CategorizationResponse>('/ai/categorization/confirm', { userId, merchant, confirmedCategory });
    return data;
  },
};
