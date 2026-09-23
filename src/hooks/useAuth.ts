import { createContext, useContext } from 'react';
import type { AuthResponse, UserResponse } from '@/types/auth';

export type AuthStatus = 'loading' | 'signed-in' | 'signed-out';

export interface AuthContextValue {
  status: AuthStatus;
  user: UserResponse | null;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  /** Stores tokens handed over by the Google redirect, then loads the account. */
  completeGoogleLogin: (tokens: {
    accessToken: string;
    refreshToken: string;
  }) => Promise<UserResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>.');
  }
  return ctx;
}
