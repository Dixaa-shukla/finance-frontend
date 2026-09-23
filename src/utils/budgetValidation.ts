import type { BudgetRequest } from '@/types/budget';

export type BudgetFieldErrors = Partial<Record<keyof BudgetRequest, string>>;

export function validateBudgetForm(values: BudgetRequest): BudgetFieldErrors {
  const errors: BudgetFieldErrors = {};

  if (values.amount === null || Number.isNaN(values.amount)) {
    errors.amount = 'Amount is required.';
  } else if (values.amount < 0.01) {
    errors.amount = 'Amount must be greater than 0.';
  }

  if (!values.period) {
    errors.period = 'Period is required.';
  }

  if (!values.startDate) {
    errors.startDate = 'Start date is required.';
  }

  const threshold = values.alertThresholdPercent;
  if (
    threshold === null ||
    threshold === undefined ||
    Number.isNaN(threshold)
  ) {
    errors.alertThresholdPercent = 'Alert threshold is required.';
  } else if (threshold < 1 || threshold > 100) {
    errors.alertThresholdPercent = 'Use a value between 1 and 100.';
  }

  return errors;
}

export function hasBudgetErrors(errors: BudgetFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
