/**
 * Module 16 — Admin Panel (/api/v1/admin/**).
 */
export interface ApiEnvelope<T> {
  success: boolean;
  /** Not included in the JSON when no message is provided. */
  message?: string;
  data: T;
  timestamp: string;
}

export interface AdminPageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  /** `private boolean last` — no `is` prefix, so the wire name matches. */
  last: boolean;
}

/** MAX_PAGE_SIZE in both paginated admin controllers. */
export const ADMIN_MAX_PAGE_SIZE = 100;

// ==================== USERS ====================

/** GET /admin/users — one row per PROFILE, newest first. */
export interface UserSummaryResponse {
  userId: number;
  fullName: string | null;
  preferredCurrency: string | null;
  profilePictureUrl: string | null;
  expenseCount: number;
  incomeCount: number;
  joinedAt: string;
}

/** GET /admin/users/{userId} — 404 when that user has no profile row. */
export interface UserDetailResponse {
  userId: number;
  fullName: string | null;
  phoneNumber: string | null;
  preferredCurrency: string | null;
  primaryFinancialGoal: string | null;
  monthlySalary: number | null;
  profilePictureUrl: string | null;

  expenseCount: number;
  incomeCount: number;
  totalSpent: number;
  totalEarned: number;
  netSavings: number;

  aiChatMessageCount: number;
  learnedMerchantCount: number;
  monthlyReportCount: number;

  healthScore: number;
  healthScoreLabel: string;

  joinedAt: string;
  lastUpdatedAt: string;
}

// ==================== ANALYTICS & REPORTS ====================

export interface PlatformOverviewResponse {
  totalUsers: number;
  totalExpenses: number;
  totalIncomes: number;
  totalInvestments: number;
  totalCategories: number;
  /** userId IS NULL — visible to every user. */
  defaultCategories: number;
  customCategories: number;
}

export interface PlatformAnalyticsResponse {
  overview: PlatformOverviewResponse;
  platformTotalSpent: number;
  platformTotalEarned: number;
  /** earned − spent across the whole platform. */
  platformNetFlow: number;
}

export interface PlatformReportResponse {
  generatedAt: string;
  analytics: PlatformAnalyticsResponse;
  aiUsage: AiUsageSummaryResponse;
}

// ==================== AI USAGE ====================

export type AiModule =
  | 'FINANCIAL_ASSISTANT'
  | 'EXPENSE_CATEGORIZATION'
  | 'SPENDING_ANALYTICS'
  | 'RECEIPT_EXTRACTION';

export type AiProvider = 'GEMINI' | 'OLLAMA';

export const AI_MODULE_LABELS: Record<AiModule, string> = {
  FINANCIAL_ASSISTANT: 'Financial Assistant',
  EXPENSE_CATEGORIZATION: 'Expense Categorization',
  SPENDING_ANALYTICS: 'Spending Analytics',
  RECEIPT_EXTRACTION: 'Receipt Extraction',
};

/**
 * GET /admin/ai-usage.
 */
export interface AiUsageSummaryResponse {
  totalChatMessages: number;
  totalUserMessages: number;
  totalAiResponses: number;
  distinctChatbotUsers: number;
  chatMessagesLast7Days: number;

  totalLearnedMerchants: number;
  distinctCategorizationUsers: number;

  totalMonthlyReports: number;

  totalAiCalls: number;
  successfulAiCalls: number;
  failedAiCalls: number;
  /** Attempts served by the secondary provider — the fail-over rate. */
  fallbackAiCalls: number;

  geminiCalls: number;
  ollamaCalls: number;

  /** Successful calls only; null until at least one is recorded. */
  averageLatencyMs: number | null;

  aiCallsLast7Days: number;
  distinctAiUsers: number;

  /** Every AiModule appears, with 0 for modules not yet exercised. */
  callsByModule: Record<AiModule, number>;
}

/** GET /admin/ai-usage/logs — one row per provider attempt, newest first. */
export interface AiUsageLogResponse {
  id: number;
  /** Null for scheduler-driven calls, which belong to no single user. */
  userId: number | null;
  module: AiModule;
  provider: AiProvider;
  /** No `is` prefix on either boolean, so both wire names match. */
  usedFallback: boolean;
  success: boolean;
  /** This attempt alone, not the whole user request. */
  latencyMs: number | null;
  errorMessage: string | null;
  createdAt: string;
}
