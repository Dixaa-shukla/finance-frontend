/**
 * Module 8 — Transaction Management.
 */

/** transaction/dto/TransactionType.java — these two values, nothing else. */
export type TransactionType = 'EXPENSE' | 'INCOME';

export interface TransactionResponse {
  /** id of the underlying Expense or Income row. Not unique on its own. */
  sourceId: number;
  type: TransactionType;
  /** Always positive. */
  amount: number;
  /** Negative for EXPENSE, positive for INCOME — what the net-flow tile sums. */
  signedAmount: number;
  category: string;
  /** Merchant for expenses, income source label for income. */
  description: string | null;
  transactionDate: string;
  /** Only populated for EXPENSE rows — fromIncome() leaves it null. */
  paymentMethod: string | null;
  notes: string | null;
  createdAt: string;
}

export interface TransactionFilters {
  type: string;
  category: string;
  startDate: string;
  endDate: string;
  minAmount: string;
  maxAmount: string;
}

export const EMPTY_TRANSACTION_FILTERS: TransactionFilters = {
  type: '',
  category: '',
  startDate: '',
  endDate: '',
  minAmount: '',
  maxAmount: '',
};

export const TRANSACTION_SORTS = [
  { value: 'transactionDate,desc', label: 'Newest first' },
  { value: 'transactionDate,asc', label: 'Oldest first' },
  { value: 'amount,desc', label: 'Largest amount' },
  { value: 'amount,asc', label: 'Smallest amount' },
];

/**
 * The backend sorts transactions by date in ascending order by default.
 * An explicit DESC is needed so the ledger shows the newest transactions first.
 */
export const DEFAULT_TRANSACTION_SORT = 'transactionDate,desc';

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

