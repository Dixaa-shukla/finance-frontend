/**
 * Module 4 — Income Management.
 */

/** com.finance_backend.income.entity.IncomeSource */
export type IncomeSource =
  | 'SALARY'
  | 'FREELANCE'
  | 'RENTAL'
  | 'INVESTMENT'
  | 'BONUS'
  | 'OTHER';

/** Every value the backend enum accepts, with a human label for the UI. */
export const INCOME_SOURCES: { value: IncomeSource; label: string }[] = [
  { value: 'SALARY', label: 'Salary' },
  { value: 'FREELANCE', label: 'Freelance' },
  { value: 'RENTAL', label: 'Rental' },
  { value: 'INVESTMENT', label: 'Investment' },
  { value: 'BONUS', label: 'Bonus' },
  { value: 'OTHER', label: 'Other' },
];

/** IncomeResponse — what GET returns. Note `recurring`, not `isRecurring`. */
export interface IncomeResponse {
  id: number;
  userId: number;
  amount: number;
  source: IncomeSource;
  categoryId: number | null;
  /** Resolved from CategoryRepository at read time; null when categoryId is null. */
  categoryName: string | null;
  incomeDate: string; // LocalDate -> "YYYY-MM-DD"
  notes: string | null;
  recurring: boolean;
  createdAt: string;
  updatedAt: string;
}

/** IncomeRequest — what POST/PUT send. Note `isRecurring`, and that it is required. */
export interface IncomeRequest {
  userId: number;
  amount: number | null;
  source: IncomeSource;
  categoryId: number | null;
  incomeDate: string;
  notes: string | null;
  isRecurring: boolean;
}


export interface IncomeFilters {
  source: string;
  categoryId: string;
  startDate: string;
  endDate: string;
  minAmount: string;
  maxAmount: string;
  isRecurring: string;
}

export const EMPTY_INCOME_FILTERS: IncomeFilters = {
  source: '',
  categoryId: '',
  startDate: '',
  endDate: '',
  minAmount: '',
  maxAmount: '',
  isRecurring: '',
};

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
