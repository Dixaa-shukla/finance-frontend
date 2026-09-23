import { axiosClient } from '@/api/axiosClient';
import type { ChatHistoryResponse, ChatRequest, ChatResponse } from '@/types/assistant';

/** Direct mappings for /api/v1/assistant. */
export const assistantService = {
  async getHistory(userId: number): Promise<ChatHistoryResponse[]> {
    const { data } = await axiosClient.get<ChatHistoryResponse[]>(`/assistant/history/${userId}`);
    return data;
  },
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const { data } = await axiosClient.post<ChatResponse>('/assistant/chat', request);
    return data;
  },
  async reindex(userId: number): Promise<{ documentsIndexed: number }> {
    const { data } = await axiosClient.post<{ documentsIndexed: number }>(`/assistant/reindex/${userId}`);
    return data;
  },
  async clearHistory(userId: number): Promise<void> {
    await axiosClient.delete(`/assistant/history/${userId}`);
  },
};
