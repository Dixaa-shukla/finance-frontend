/**
 * Module 1 — Authentication & Security
 */

/** POST /auth/register —it takes ONLY email + password. */
export interface RegisterRequest {
  email: string;
  password: string;
}

/** POST /auth/login */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Returned by POST /auth/login and POST /auth/refresh.
 */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string; // always "Bearer"
  expiresIn: number; // seconds — 900 by default
  userId: number;
  email: string;
  roles: string[]; // WITHOUT the ROLE_ prefix, e.g. ["USER"] or ["USER","ADMIN"]
}

/** Returned by POST /auth/register (201) and GET /auth/me (200). */
export interface UserResponse {
  id: number;
  email: string;

  roles: string[];
  enabled: boolean;
  provider: string; // "LOCAL" for email/password, "GOOGLE" for Google sign-in
  createdAt: string;
  updatedAt: string;
}

/** POST /auth/reset-password — `token` comes from the emailed link. */
export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

/** POST /auth/change-password — requires a Bearer token. */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/** Returned by forgot-password (202), reset-password (200), change-password (200). */
export interface MessageResponse {
  message: string;
}
