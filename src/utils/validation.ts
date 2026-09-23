import type { ProfileRequest } from '@/types/profile';

export type FieldErrors = Partial<Record<keyof ProfileRequest, string>>;

const PHONE_REGEX = /^\+?[0-9]{7,15}$/;

export function validateProfileForm(values: ProfileRequest): FieldErrors {
  const errors: FieldErrors = {};

  if (!values.fullName || !values.fullName.trim()) {
    errors.fullName = 'Full name is required.';
  } else if (values.fullName.length > 100) {
    errors.fullName = 'Full name must not exceed 100 characters.';
  }

  if (values.phoneNumber && !PHONE_REGEX.test(values.phoneNumber)) {
    errors.phoneNumber = 'Enter a valid phone number (7–15 digits).';
  }

  if (values.dateOfBirth) {
    const dob = new Date(values.dateOfBirth);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dob.getTime() >= today.getTime()) {
      errors.dateOfBirth = 'Date of birth must be in the past.';
    }
  }

  if (values.gender && values.gender.length > 20) {
    errors.gender = 'Gender must not exceed 20 characters.';
  }

  if (
    values.monthlySalary !== null &&
    values.monthlySalary !== undefined &&
    values.monthlySalary < 0
  ) {
    errors.monthlySalary = 'Monthly salary cannot be negative.';
  }

  if (!values.preferredCurrency || !values.preferredCurrency.trim()) {
    errors.preferredCurrency = 'Preferred currency is required.';
  } else if (values.preferredCurrency.length !== 3) {
    errors.preferredCurrency =
      'Preferred currency must be a 3-letter ISO code, e.g. INR.';
  }

  if (
    values.primaryFinancialGoal &&
    values.primaryFinancialGoal.length > 255
  ) {
    errors.primaryFinancialGoal =
      'Financial goal must not exceed 255 characters.';
  }

  return errors;
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}