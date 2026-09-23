import { todayISO } from '@/utils/format';
import type { InvestmentRequest } from '@/types/investment';

export type InvestmentFieldErrors = Partial<
  Record<keyof InvestmentRequest, string>
>;

export function validateInvestmentForm(
  values: InvestmentRequest
): InvestmentFieldErrors {
  const errors: InvestmentFieldErrors = {};

  if (!values.name || !values.name.trim()) {
    errors.name = 'Name is required.';
  } else if (values.name.length > 150) {
    errors.name = 'Name must not exceed 150 characters.';
  }

  if (values.investedAmount === null || Number.isNaN(values.investedAmount)) {
    errors.investedAmount = 'Invested amount is required.';
  } else if (values.investedAmount < 0.01) {
    errors.investedAmount = 'Invested amount must be greater than 0.';
  }

  // Optional, but negative is rejected by @DecimalMin("0.0").
  if (values.currentValue !== null && values.currentValue < 0) {
    errors.currentValue = 'Current value cannot be negative.';
  }

  if (values.quantity !== null && values.quantity < 0) {
    errors.quantity = 'Quantity cannot be negative.';
  }

  if (!values.purchaseDate) {
    errors.purchaseDate = 'Purchase date is required.';
  } else if (values.purchaseDate > todayISO()) {
    // @PastOrPresent — the same rule the expense and income dates carry.
    errors.purchaseDate = 'Purchase date cannot be in the future.';
  }

  if (values.interestRate !== null) {
    if (values.interestRate < 0) {
      errors.interestRate = 'Interest rate cannot be negative.';
    } else if (values.interestRate > 100) {
      errors.interestRate = 'Interest rate cannot exceed 100.';
    }
  }

  /*
 * The backend does not validate this, so we block maturity dates that are
 * before purchaseDate. A past maturity date is still valid because it means
 * the deposit has already matured.
 */
  if (
    values.maturityDate &&
    values.purchaseDate &&
    values.maturityDate < values.purchaseDate
  ) {
    errors.maturityDate = 'Maturity date cannot be before the purchase date.';
  }

  if (values.notes && values.notes.length > 500) {
    errors.notes = 'Notes must not exceed 500 characters.';
  }

  return errors;
}

export function hasInvestmentErrors(errors: InvestmentFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
