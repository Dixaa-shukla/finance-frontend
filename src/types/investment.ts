
export type InvestmentType =
  | 'STOCK'
  | 'MUTUAL_FUND'
  | 'SIP'
  | 'FIXED_DEPOSIT'
  | 'PPF'
  | 'EPF'
  | 'NPS'
  | 'GOLD'
  | 'CRYPTO'
  | 'BOND'
  | 'OTHER';


export const INVESTMENT_TYPES: {
  value: InvestmentType;
  label: string;
  unit: string;
}[] = [
  { value: 'STOCK', label: 'Stocks', unit: 'shares' },
  { value: 'MUTUAL_FUND', label: 'Mutual Funds', unit: 'units' },
  { value: 'SIP', label: 'SIP', unit: 'units' },
  { value: 'FIXED_DEPOSIT', label: 'Fixed Deposit', unit: 'deposits' },
  { value: 'PPF', label: 'PPF', unit: 'units' },
  { value: 'EPF', label: 'EPF', unit: 'units' },
  { value: 'NPS', label: 'NPS', unit: 'units' },
  { value: 'GOLD', label: 'Gold', unit: 'grams' },
  { value: 'CRYPTO', label: 'Crypto', unit: 'coins' },
  { value: 'BOND', label: 'Bonds', unit: 'bonds' },
  { value: 'OTHER', label: 'Other', unit: 'units' },
];

export const INVESTMENT_TYPE_LABELS: Record<InvestmentType, string> =
  INVESTMENT_TYPES.reduce(
    (acc, item) => ({ ...acc, [item.value]: item.label }),
    {} as Record<InvestmentType, string>
  );

/** Types where maturityDate and interestRate are the fields that matter. */
export const FIXED_RETURN_TYPES: InvestmentType[] = [
  'FIXED_DEPOSIT',
  'PPF',
  'EPF',
  'NPS',
  'BOND',
];

export interface InvestmentResponse {
  id: number;
  userId: number;
  type: InvestmentType;
  name: string;
  investedAmount: number;
  /** Never null — defaults to investedAmount on write. */
  currentValue: number;
  quantity: number | null;
  purchaseDate: string;
  maturityDate: string | null;
  interestRate: number | null;
  notes: string | null;
  /** currentValue - investedAmount. Negative is a loss. */
  gainLossAmount: number;
  gainLossPercent: number;
  /** maturityDate is set and is today or earlier. Computed per read. */
  matured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InvestmentRequest {
  userId: number;
  type: InvestmentType;
  name: string;
  investedAmount: number | null;
  /** Omitted means "same as invested" — the server fills it in. */
  currentValue: number | null;
  quantity: number | null;
  purchaseDate: string;
  maturityDate: string | null;
  interestRate: number | null;
  notes: string | null;
}

/** One row of InvestmentSummaryResponse.breakdownByType, sorted by type name. */
export interface InvestmentTypeBreakdown {
  type: InvestmentType;
  count: number;
  investedAmount: number;
  currentValue: number;
  gainLossAmount: number;
  gainLossPercent: number;
}

export interface InvestmentSummaryResponse {
  userId: number;
  totalInvested: number;
  totalCurrentValue: number;
  totalGainLossAmount: number;
  totalGainLossPercent: number;
  totalInvestmentCount: number;
  breakdownByType: InvestmentTypeBreakdown[];
}
