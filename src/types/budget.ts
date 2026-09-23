/**
 * Module 6 — Budget Planner.
 */

/** com.finance_backend.budget.entity.BudgetPeriod */
export type BudgetPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export const BUDGET_PERIODS: { value: BudgetPeriod; label: string }[] = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
];

/** BudgetResponse — what every GET returns. */
export interface BudgetResponse {
  id: number;
  userId: number;
  /** null on an overall budget spanning every category. */
  categoryId: number | null;
  /** Resolved from categoryId at read time; null for an overall budget. */
  categoryName: string | null;
  period: BudgetPeriod;
  amount: number;
  startDate: string;
  /** Computed: DAILY = startDate, WEEKLY = +6 days, MONTHLY = +1 month −1 day. */
  endDate: string;
  spentAmount: number;
  /** amount − spentAmount. Goes NEGATIVE once the budget is overspent. */
  remainingAmount: number;
  /** spent / amount × 100, unclamped — can exceed 100. */
  percentUsed: number;
  /** percentUsed >= alertThresholdPercent, decided server-side. */
  alertTriggered: boolean;
  alertThresholdPercent: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * BudgetRequest — the body for POST /budgets and PUT /budgets/{id}.
 */
export interface BudgetRequest {
  userId: number;
  /** Optional; when set it must reference an existing EXPENSE category (400 otherwise). */
  categoryId: number | null;
  period: BudgetPeriod;
  /** null only while the amount box is empty; @NotNull @DecimalMin("0.01") server-side. */
  amount: number | null;
  startDate: string;
  /** @Min(1) @Max(100); the backend's own default is 80. */
  alertThresholdPercent: number;
}

/**
 * Decides which budgets to show in the grid.
 * The backend already returns all budgets with their current spending,
 * so the selected period is filtered in the browser.
 */
export type BudgetPeriodScope = 'ALL' | BudgetPeriod;
