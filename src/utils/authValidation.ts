/**
 * Module 1 — Authentication & Security.
 */

export type AuthFieldErrors = Record<string, string>;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

const PASSWORD_PATTERN_MESSAGE =
  'Password must contain at least one uppercase letter, one lowercase letter, and one digit.';

const PASSWORD_MIN = 8;
const PASSWORD_MAX = 72;

const EMAIL_MAX = 150;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email: string, errors: AuthFieldErrors): void {
  if (!email || !email.trim()) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_PATTERN.test(email.trim())) {
    errors.email = 'Enter a valid email address.';
  } else if (email.trim().length > EMAIL_MAX) {
    errors.email = `Email must not exceed ${EMAIL_MAX} characters.`;
  }
}

function validatePassword(
  password: string,
  field: string,
  errors: AuthFieldErrors
): void {
  if (!password) {
    errors[field] = 'Password is required.';
  } else if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    errors[field] = `Password must be between ${PASSWORD_MIN} and ${PASSWORD_MAX} characters.`;
  } else if (!PASSWORD_PATTERN.test(password)) {
    errors[field] = PASSWORD_PATTERN_MESSAGE;
  }
}

/**
 * LOGIN.
 */
export function validateLoginForm(values: {
  email: string;
  password: string;
}): AuthFieldErrors {
  const errors: AuthFieldErrors = {};

  validateEmail(values.email, errors);

  if (!values.password) {
    errors.password = 'Password is required.';
  }

  return errors;
}

/**
 * REGISTER.
 */
export function validateRegisterForm(values: {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}): AuthFieldErrors {
  const errors: AuthFieldErrors = {};

  // 100 matches ProfileRequest.fullName, which is where this value ends up.
  if (!values.fullName || !values.fullName.trim()) {
    errors.fullName = 'Full name is required.';
  } else if (values.fullName.trim().length > 100) {
    errors.fullName = 'Full name must not exceed 100 characters.';
  }

  validateEmail(values.email, errors);
  validatePassword(values.password, 'password', errors);

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password.';
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  if (!values.acceptTerms) {
    errors.acceptTerms = 'Please accept the Terms of Service to continue.';
  }

  return errors;
}

/** FORGOT PASSWORD —  */
export function validateForgotPasswordForm(values: {
  email: string;
}): AuthFieldErrors {
  const errors: AuthFieldErrors = {};
  validateEmail(values.email, errors);
  return errors;
}

/** RESET PASSWORD — mirrors ResetPasswordRequest.newPassword. */
export function validateResetPasswordForm(values: {
  newPassword: string;
  confirmPassword: string;
}): AuthFieldErrors {
  const errors: AuthFieldErrors = {};

  validatePassword(values.newPassword, 'newPassword', errors);

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Please confirm your new password.';
  } else if (values.confirmPassword !== values.newPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return errors;
}

/**
 * CHANGE PASSWORD — mirrors ChangePasswordRequest.
 */
export function validateChangePasswordForm(values: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): AuthFieldErrors {
  const errors: AuthFieldErrors = {};

  if (!values.currentPassword) {
    errors.currentPassword = 'Your current password is required.';
  }

  validatePassword(values.newPassword, 'newPassword', errors);

  // Catches the no-op before it costs a round trip and a forced re-login.
  if (
    values.newPassword &&
    values.currentPassword &&
    values.newPassword === values.currentPassword
  ) {
    errors.newPassword = 'Your new password must be different from the current one.';
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Please confirm your new password.';
  } else if (values.confirmPassword !== values.newPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return errors;
}

export function hasAuthErrors(errors: AuthFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

/**
 * Drives the password strength meter.
 * Returns 0–3 based on the backend's password rules and the required length.
 */
export function passwordStrength(password: string): {
  score: number;
  label: string;
} {
  if (!password) return { score: 0, label: '' };

  let score = 0;
  if (password.length >= PASSWORD_MIN) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;

  const labels = ['', 'Weak', 'Fair', 'Strong'];
  return { score, label: labels[score] };
}
