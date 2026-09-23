
export type PaymentMethod =
  | 'CASH'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'UPI'
  | 'NET_BANKING'
  | 'WALLET'
  | 'OTHER';

/** Dropdown options. The value is what the backend enum expects. */
export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'UPI', label: 'UPI' },
  { value: 'CASH', label: 'Cash' },
  { value: 'CREDIT_CARD', label: 'Credit Card' },
  { value: 'DEBIT_CARD', label: 'Debit Card' },
  { value: 'NET_BANKING', label: 'Net Banking' },
  { value: 'WALLET', label: 'Wallet' },
  { value: 'OTHER', label: 'Other' },
];

export const CATEGORY_SUGGESTIONS = [
  'Food & Dining',
  'Shopping',
  'Transport',
  'Entertainment',
  'Bills & Utilities',
  'Others',
];

/** Returned by GET /expenses/{id}, /expenses/user/{userId} and the search endpoint. */
export interface ExpenseResponse {
  id: number;
  userId: number;
  amount: number;
  category: string;
  merchant: string | null;
  expenseDate: string; // ISO date, e.g. "2026-08-25"
  paymentMethod: PaymentMethod;
  notes: string | null;
  receiptUrl: string | null;
  location: string | null;
  tags: string[] | null;
  createdAt: string;
  updatedAt: string;
}

/** Body for POST /expenses and PUT /expenses/{id}. */
export interface ExpenseRequest {
  userId: number;
  amount: number | null;
  category: string;
  merchant?: string | null;
  expenseDate: string;
  paymentMethod: PaymentMethod;
  notes?: string | null;
  receiptUrl?: string | null;
  location?: string | null;
  tags?: string[] | null;
}


export interface ExpenseFilters {
  category: string;
  paymentMethod: string;
  merchant: string;
  startDate: string;
  endDate: string;
  minAmount: string;
  maxAmount: string;
  tag: string;
}

export const EMPTY_FILTERS: ExpenseFilters = {
  category: '',
  paymentMethod: '',
  merchant: '',
  startDate: '',
  endDate: '',
  minAmount: '',
  maxAmount: '',
  tag: '',
};

/** Just the parts of Spring Data's Page JSON that this UI reads. */
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // current page index, 0-based
  size: number;
}
