export type CategorizationSource = 'LEARNED' | 'AI_SUGGESTED';

export interface CategorizationResponse {
  detectedMerchant: string;
  suggestedCategory: string;
  source: CategorizationSource;
}
