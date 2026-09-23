import { todayISO } from '@/utils/format';
import type { ExpenseRequest } from '@/types/expense';

export type ExpenseFieldErrors = Partial<Record<keyof ExpenseRequest, string>>;

/**
 * Mirrors the @Valid constraints on ExpenseRequest one-for-one, so the user is
 * shown the same rule in the browser that the server will apply:
 *
 *   amount        @NotNull @DecimalMin("0.01")
 *   category      @NotBlank @Size(max = 50)
 *   merchant      @Size(max = 150)
 *   expenseDate   @NotNull @PastOrPresent
 *   paymentMethod @NotNull
 *   notes         @Size(max = 500)
 *   location      @Size(max = 150)
 *   tags          each @Size(max = 30)
 */
export function validateExpenseForm(
  values: ExpenseRequest
): ExpenseFieldErrors {
  const errors: ExpenseFieldErrors = {};

  if (values.amount === null || Number.isNaN(values.amount)) {
    errors.amount = 'Amount is required.';
  } else if (values.amount < 0.01) {
    errors.amount = 'Amount must be greater than 0.';
  }

  if (!values.category || !values.category.trim()) {
    errors.category = 'Category is required.';
  } else if (values.category.length > 50) {
    errors.category = 'Category must not exceed 50 characters.';
  }

  if (values.merchant && values.merchant.length > 150) {
    errors.merchant = 'Merchant must not exceed 150 characters.';
  }

  if (!values.expenseDate) {
    errors.expenseDate = 'Date is required.';
  } else if (values.expenseDate > todayISO()) {
    // String compare is safe here: both sides are "YYYY-MM-DD".
    errors.expenseDate = 'Date cannot be in the future.';
  }

  if (!values.paymentMethod) {
    errors.paymentMethod = 'Payment method is required.';
  }

  if (values.notes && values.notes.length > 500) {
    errors.notes = 'Notes must not exceed 500 characters.';
  }

  if (values.location && values.location.length > 150) {
    errors.location = 'Location must not exceed 150 characters.';
  }

  if (values.tags && values.tags.some((tag) => tag.length > 30)) {
    errors.tags = 'Each tag must not exceed 30 characters.';
  }

  return errors;
}

export function hasExpenseErrors(errors: ExpenseFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
