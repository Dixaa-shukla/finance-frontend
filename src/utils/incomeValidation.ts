import { todayISO } from '@/utils/format';
import type { IncomeRequest } from '@/types/income';

export type IncomeFieldErrors = Partial<Record<keyof IncomeRequest, string>>;

export function validateIncomeForm(values: IncomeRequest): IncomeFieldErrors {
  const errors: IncomeFieldErrors = {};

  if (values.amount === null || Number.isNaN(values.amount)) {
    errors.amount = 'Amount is required.';
  } else if (values.amount < 0.01) {
    errors.amount = 'Amount must be greater than 0.';
  }

  if (!values.source) {
    errors.source = 'Source is required.';
  }

  if (!values.incomeDate) {
    errors.incomeDate = 'Date is required.';
  } else if (values.incomeDate > todayISO()) {
    // String compare is safe here: both sides are "YYYY-MM-DD".
    errors.incomeDate = 'Date cannot be in the future.';
  }

  if (values.notes && values.notes.length > 500) {
    errors.notes = 'Notes must not exceed 500 characters.';
  }

  return errors;
}

export function hasIncomeErrors(errors: IncomeFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
