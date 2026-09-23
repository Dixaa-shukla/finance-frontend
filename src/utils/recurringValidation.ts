import { todayISO } from '@/utils/format';
import { countOccurrencesThrough } from '@/utils/recurringSchedule';
import type { RecurringTransactionRequest } from '@/types/recurring';

export type RecurringFieldErrors = Partial<
  Record<keyof RecurringTransactionRequest, string>
>;

export function validateRecurringForm(
  values: RecurringTransactionRequest
): RecurringFieldErrors {
  const errors: RecurringFieldErrors = {};

  if (!values.title || !values.title.trim()) {
    errors.title = 'Title is required.';
  } else if (values.title.length > 100) {
    errors.title = 'Title must not exceed 100 characters.';
  }

  if (values.amount === null || Number.isNaN(values.amount)) {
    errors.amount = 'Amount is required.';
  } else if (values.amount < 0.01) {
    errors.amount = 'Amount must be greater than 0.';
  }

  
  if (values.type === 'EXPENSE') {
    if (!values.category || !values.category.trim()) {
      errors.category = 'Category is required for an expense rule.';
    } else if (values.category.length > 50) {
      errors.category = 'Category must not exceed 50 characters.';
    }
  }

  if (values.type === 'INCOME' && !values.incomeSource) {
    errors.incomeSource = 'Income source is required for an income rule.';
  }

  if (!values.startDate) {
    errors.startDate = 'Start date is required.';
  }


  if (values.endDate && values.startDate && values.endDate < values.startDate) {
    errors.endDate = 'End date cannot be before the start date.';
  }

  if (values.notes && values.notes.length > 500) {
    errors.notes = 'Notes must not exceed 500 characters.';
  }

  return errors;
}

export function hasRecurringErrors(errors: RecurringFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

/**
 * Shows how many records the first sweep would create for a past startDate.
 * Returns null when there is nothing to warn about.
 *
 * A backdated recurring rule can create many records at once because the backend
 * processes every missed date up to today.
 */
export function describeBackfill(
  values: RecurringTransactionRequest
): string | null {
  if (!values.startDate || values.startDate >= todayISO()) return null;

  const { count, capped } = countOccurrencesThrough(
    values.startDate,
    todayISO(),
    values.frequency,
    values.endDate
  );
  if (count <= 1) return null;

  const noun = values.type === 'EXPENSE' ? 'expense' : 'income';
  return `${capped ? `${count}+` : count} ${noun} rows will be created in one go`;
}

