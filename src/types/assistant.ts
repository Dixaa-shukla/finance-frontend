/** Module 11 — mirrors the AI Financial Assistant backend DTOs. */
export type ChatRole = 'USER' | 'ASSISTANT';

export interface ChatHistoryResponse {
  role: ChatRole;
  message: string;
  createdAt: string;
}

export interface ChatRequest {
  userId: number;
  message: string;
}

export interface ChatResponse {
  reply: string;
  timestamp: string;
}
