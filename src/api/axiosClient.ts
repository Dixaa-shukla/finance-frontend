import axios from 'axios';
import type { ApiErrorResponse } from '@/types/profile';
import type { AuthResponse } from '@/types/auth';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  saveTokens,
} from '@/api/tokenStorage';

const BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  'http://localhost:8080/api/v1';

/**
 * Gets the server URL without /api/v1.
 * Google Sign-In uses /oauth2/authorization/google, so it must use the server root URL.
 */
export const SERVER_ORIGIN = new URL(BASE_URL).origin;

export const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  /*
 * Keep this set to false.
 * Bearer-token authentication does not need credentials, and enabling them can
 * cause the browser to reject successful responses, making requests appear to fail.
 */
  withCredentials: false,
});

// Attaches the JWT minted by POST /api/v1/auth/login (or by Google sign-in).
axiosClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ==================== 401 -> REFRESH -> RETRY ====================

let refreshInFlight: Promise<string> | null = null;

let onAuthExpired: (() => void) | null = null;

export function setOnAuthExpired(handler: () => void): void {
  onAuthExpired = handler;
}

function refreshAccessToken(): Promise<string> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token stored.');

    /*
 * Use plain axios, not axiosClient.
 * This prevents the expired token from being sent and avoids the refresh request
 * calling itself repeatedly if the refresh fails.
 */
    const { data } = await axios.post<AuthResponse>(
      `${BASE_URL}/auth/refresh`,
      { refreshToken },
      // withCredentials stays off here for the same reason as above 
      { headers: { 'Content-Type': 'application/json' } }
    );

    
    saveTokens({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      userId: data.userId,
      email: data.email,
    });

    return data.accessToken;
  })();

  // Clear the slot either way, so the NEXT 401 starts a fresh attempt.
  refreshInFlight = refreshInFlight.finally(() => {
    refreshInFlight = null;
  }) as Promise<string>;

  return refreshInFlight;
}

/** Endpoints where a 401 is the real answer, not an expired-token signal. */
function isAuthEndpoint(url: string | undefined): boolean {
  if (!url) return false;
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/refresh') ||
    url.includes('/auth/forgot-password') ||
    url.includes('/auth/reset-password')
  );
}

axiosClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || !error.config) {
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const config = error.config as typeof error.config & { _retried?: boolean };

    /*
 * Only 401 errors should trigger a token refresh.
 * A 403 means the token is valid but the user does not have permission,
 * so refreshing the token would not change anything.
 */
    if (
      status !== 401 ||
      config._retried ||
      isAuthEndpoint(config.url) ||
      !getRefreshToken()
    ) {
      return Promise.reject(error);
    }

    config._retried = true; // one attempt per request, never a loop

    try {
      const newToken = await refreshAccessToken();
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${newToken}`;
      return axiosClient.request(config);
    } catch {
      // The refresh token is expired or was revoked (logout-all, a password
      // change, or a password reset all revoke every session).
      clearTokens();
      if (onAuthExpired) onAuthExpired();
      return Promise.reject(error);
    }
  }
);

/** Normalizes any axios error into a friendly message, never a raw stack trace. */
export function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    if (error.response?.status === 404) {
      return error.response.data?.message ?? 'Not found.';
    }
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    // Backend key is `fieldErrors` (see common/exception/ErrorResponse).
    if (error.response?.data?.fieldErrors) {
      const first = Object.values(error.response.data.fieldErrors)[0];
      if (first) return first;
    }
    if (error.code === 'ERR_NETWORK') {
      return 'Could not reach the server. Please check your connection.';
    }
  }
  return fallback;
}

/**
 * Gets validation errors for each field from the backend.
 */
export function extractFieldErrors(
  error: unknown
): Record<string, string> | null {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.fieldErrors ?? null;
  }
  return null;
}

export function getCurrentUserId(): number | null {
  // Written by tokenStorage.saveTokens() on login / Google sign-in.
  const stored = localStorage.getItem('nova_current_user_id');
  if (stored) return Number(stored);
  return null;
}
