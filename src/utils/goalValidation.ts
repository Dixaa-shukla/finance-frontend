import { todayISO } from '@/utils/format';
import type { GoalRequest } from '@/types/goal';

export type GoalFieldErrors = Partial<Record<keyof GoalRequest, string>>;

export function validateGoalForm(values: GoalRequest): GoalFieldErrors {
  const errors: GoalFieldErrors = {};

  if (!values.title || !values.title.trim()) {
    errors.title = 'Title is required.';
  } else if (values.title.length > 100) {
    errors.title = 'Title must not exceed 100 characters.';
  }

  if (values.description && values.description.length > 500) {
    errors.description = 'Description must not exceed 500 characters.';
  }

  if (values.targetAmount === null || Number.isNaN(values.targetAmount)) {
    errors.targetAmount = 'Target amount is required.';
  } else if (values.targetAmount < 0.01) {
    errors.targetAmount = 'Target amount must be greater than 0.';
  }

  if (!values.targetDate) {
    errors.targetDate = 'Target date is required.';
  } else if (values.targetDate < todayISO()) {
    // Plain string comparison is safe and exact for ISO "YYYY-MM-DD", and avoids
    // the UTC-midnight shift that new Date("2026-08-27") would introduce.
    errors.targetDate = 'Target date cannot be in the past.';
  }

  return errors;
}

export function hasGoalErrors(errors: GoalFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function validateContribution(amount: number | null): string | null {
  if (amount === null || Number.isNaN(amount)) return 'Amount is required.';
  if (amount < 0.01) return 'Amount must be greater than 0.';
  return null;
}
