import { axiosClient, SERVER_ORIGIN } from '@/api/axiosClient';
import type {
  AuthResponse,
  ChangePasswordRequest,
  LoginRequest,
  MessageResponse,
  RegisterRequest,
  ResetPasswordRequest,
  UserResponse,
} from '@/types/auth';


export const authService = {
  
  register: async (payload: RegisterRequest): Promise<UserResponse> => {
    const { data } = await axiosClient.post<UserResponse>(
      '/auth/register',
      payload
    );
    return data;
  },

  /** POST /api/v1/auth/login → 200 AuthResponse */
  login: async (payload: LoginRequest): Promise<AuthResponse> => {
    const { data } = await axiosClient.post<AuthResponse>('/auth/login', payload);
    return data;
  },

  /**
   * POST /api/v1/auth/logout → 204
   */
  logout: async (refreshToken: string | null): Promise<void> => {
    await axiosClient.post('/auth/logout', { refreshToken });
  },

  /** POST /api/v1/auth/logout-all → 204. Requires a Bearer token. */
  logoutAll: async (): Promise<void> => {
    await axiosClient.post('/auth/logout-all');
  },

  /** GET /api/v1/auth/me → 200 UserResponse. Requires a Bearer token. */
  getCurrentUser: async (): Promise<UserResponse> => {
    const { data } = await axiosClient.get<UserResponse>('/auth/me');
    return data;
  },

  /**
   * POST /api/v1/auth/forgot-password → 202 MessageResponse
   */
  forgotPassword: async (email: string): Promise<MessageResponse> => {
    const { data } = await axiosClient.post<MessageResponse>(
      '/auth/forgot-password',
      { email }
    );
    return data;
  },

  /** POST /api/v1/auth/reset-password → 200 MessageResponse */
  resetPassword: async (
    payload: ResetPasswordRequest
  ): Promise<MessageResponse> => {
    const { data } = await axiosClient.post<MessageResponse>(
      '/auth/reset-password',
      payload
    );
    return data;
  },

  /**
   * POST /api/v1/auth/change-password → 200 MessageResponse
   */
  changePassword: async (
    payload: ChangePasswordRequest
  ): Promise<MessageResponse> => {
    const { data } = await axiosClient.post<MessageResponse>(
      '/auth/change-password',
      payload
    );
    return data;
  },
};

/**
 * Google sign-in with a full page navigation.
  On success OAuth2LoginSuccessHandler redirects
 * the browser to finance.auth.frontend-redirect-uri, which is
 * http://localhost:5173/oauth2/callback.
 */
export function startGoogleLogin(): void {
  window.location.href = `${SERVER_ORIGIN}/oauth2/authorization/google`;
}
