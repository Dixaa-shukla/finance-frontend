/**
 * Module 1 — Authentication & Security.
 */

/** VITE_AUTH_TOKEN_STORAGE_KEY so it matches axiosClient's own default. */
const ACCESS_TOKEN_KEY =
  (import.meta.env.VITE_AUTH_TOKEN_STORAGE_KEY as string | undefined) ??
  'nova_access_token';

const REFRESH_TOKEN_KEY = 'nova_refresh_token';

/**
 * This key is used by getCurrentUserId() to find the logged-in user's ID.
 */
const USER_ID_KEY = 'nova_current_user_id';

const EMAIL_KEY = 'nova_current_email';

/*
 * Stores the email for the "Remember me" option so it can be prefilled next time.
 * It does not extend the login session; the session length is controlled by the
 * backend. This value stays after logout.
 */
const REMEMBER_EMAIL_KEY = 'nova_remembered_email';

export function getRememberedEmail(): string | null {
  return localStorage.getItem(REMEMBER_EMAIL_KEY);
}

export function setRememberedEmail(email: string | null): void {
  if (email) {
    localStorage.setItem(REMEMBER_EMAIL_KEY, email);
  } else {
    localStorage.removeItem(REMEMBER_EMAIL_KEY);
  }
}

/**
 * Stores a one-time message to show on the sign-in page after forced logout.
 */
const AUTH_NOTICE_KEY = 'nova_auth_notice';

let noticeCache: string | null | undefined;

export function setAuthNotice(message: string): void {
  sessionStorage.setItem(AUTH_NOTICE_KEY, message);
  // Reset the cache .
  noticeCache = undefined;
}

/** Returns the pending notice AND consumes it. */
export function takeAuthNotice(): string | null {
  if (noticeCache === undefined) {
    noticeCache = sessionStorage.getItem(AUTH_NOTICE_KEY);
    sessionStorage.removeItem(AUTH_NOTICE_KEY);
  }
  return noticeCache;
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredEmail(): string | null {
  return localStorage.getItem(EMAIL_KEY);
}

/** Called after login, after Google sign-in, and after every token refresh. */
export function saveTokens(tokens: {
  accessToken: string;
  refreshToken: string;
  userId?: number;
  email?: string;
}): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);

  // userId/email are absent on the Google callback (the backend redirect only
  // carries the four token params).
  if (tokens.userId !== undefined) {
    localStorage.setItem(USER_ID_KEY, String(tokens.userId));
  }
  if (tokens.email) {
    localStorage.setItem(EMAIL_KEY, tokens.email);
  }
}

/** Fills in the identity the Google callback could not supply, from GET /auth/me. */
export function saveIdentity(userId: number, email: string): void {
  localStorage.setItem(USER_ID_KEY, String(userId));
  localStorage.setItem(EMAIL_KEY, email);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_ID_KEY);
  localStorage.removeItem(EMAIL_KEY);
}
