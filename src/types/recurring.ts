import type { IncomeSource } from '@/types/income';
import type { PaymentMethod } from '@/types/expense';

/**
 * Module 9 — Recurring Transactions.
 */

/** com.finance_backend.recurring.entity.RecurringTransactionType */
export type RecurringTransactionType = 'EXPENSE' | 'INCOME';

/** com.finance_backend.recurring.entity.RecurringFrequency — all four values. */
export type RecurringFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

/**
 * `every` is the phrasing used on the cards ("every month"); `noun` is used where
 * a bare adjective reads better ("Monthly outflow").
 */
export const RECURRING_FREQUENCIES: {
  value: RecurringFrequency;
  label: string;
  every: string;
}[] = [
  { value: 'DAILY', label: 'Daily', every: 'every day' },
  { value: 'WEEKLY', label: 'Weekly', every: 'every week' },
  { value: 'MONTHLY', label: 'Monthly', every: 'every month' },
  { value: 'YEARLY', label: 'Yearly', every: 'every year' },
];

export const FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  YEARLY: 'Yearly',
};

/** RecurringTransactionResponse — what every recurring GET/PUT/PATCH returns. */
export interface RecurringTransactionResponse {
  id: number;
  userId: number;
  type: RecurringTransactionType;
  title: string;
  amount: number;
  /** Set only for EXPENSE rules; a free string, exactly like Expense.category. */
  category: string | null;
  /** Set only for INCOME rules. */
  incomeSource: IncomeSource | null;
  /** Optional even on an EXPENSE rule — the generator falls back to OTHER. */
  paymentMethod: PaymentMethod | null;
  frequency: RecurringFrequency;
  startDate: string; // LocalDate -> "YYYY-MM-DD"

  nextDueDate: string;
  /** null means the rule runs indefinitely. */
  endDate: string | null;
  /** See the header note: "active", not "isActive". */
  active: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * RecurringTransactionRequest — the body shared by POST and PUT /{id}.
 */
export interface RecurringTransactionRequest {
  userId: number;
  type: RecurringTransactionType;
  title: string;
  amount: number | null;
  /** Send null for an INCOME rule rather than a leftover string. */
  category: string | null;
  /** Send null for an EXPENSE rule. */
  incomeSource: IncomeSource | null;
  paymentMethod: PaymentMethod | null;
  frequency: RecurringFrequency;
  startDate: string;
  endDate: string | null;
  notes: string | null;
}

/**
 * Decides which recurring rules to show in the grid.
 * All filtering, searching, sorting, and tab changes happen in the browser because
 * the backend does not provide these options. OVERDUE means an active rule is due today or earlier.
 */
export type RecurringScope = 'ALL' | 'ACTIVE' | 'PAUSED' | 'OVERDUE';

/** The response of POST /recurring-transactions/process-due. */
export interface ProcessDueResponse {
  transactionsGenerated: number;
}

