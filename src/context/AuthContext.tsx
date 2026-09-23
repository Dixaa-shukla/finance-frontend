import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { authService } from '@/api/authService';
import { extractErrorMessage, setOnAuthExpired } from '@/api/axiosClient';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  saveIdentity,
  saveTokens,
} from '@/api/tokenStorage';
import {
  AuthContext,
  type AuthContextValue,
  type AuthStatus,
} from '@/hooks/useAuth';
import type { UserResponse } from '@/types/auth';

/**
 * Module 1 — Authentication & Security.
 * Keeps track of whether a user is signed in and stores the current user details.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
 // Start with 'loading' only when a token already exists; otherwise show /login directly.
  const [status, setStatus] = useState<AuthStatus>(() =>
    getAccessToken() ? 'loading' : 'signed-out'
  );
  const [user, setUser] = useState<UserResponse | null>(null);

  /**
   * Verifies the stored token against the backend.
   */
  const loadUser = useCallback(async () => {
    /*
 * No token means there is nothing to verify.
 * The initial state is already 'signed-out', avoiding an unnecessary extra render.
 */
    if (!getAccessToken()) return;

    try {
      const me = await authService.getCurrentUser();
      setUser(me);
      saveIdentity(me.id, me.email);
      setStatus('signed-in');
    } catch {
      // A 401 here already went through axiosClient's refresh-and-retry, so
      // reaching this means the refresh token is dead too.
      clearTokens();
      setUser(null);
      setStatus('signed-out');
    }
  }, []);

  useEffect(() => {
    /*
 * ESLint flags this line because loadUser updates state inside the effect.
 * The updates happen after the API call, so this is safe and matches the
 * same pattern already used in hooks/useProfile.ts.
 */
// eslint-disable-next-line react-hooks/set-state-in-effect
    loadUser();
  }, [loadUser]);

 
  useEffect(() => {
    setOnAuthExpired(() => {
      setUser(null);
      setStatus('signed-out');
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await authService.login({ email, password });

    saveTokens({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      userId: tokens.userId,
      email: tokens.email,
    });

    /*
 * Build the user directly from the login response because it already has the ID,
 * email, and roles. To avoids an unnecessary GET /auth/me request.
 */
    setUser({
      id: tokens.userId,
      email: tokens.email,
      roles: tokens.roles,
      enabled: true,
      provider: 'LOCAL',
      createdAt: '',
      updatedAt: '',
    });
    setStatus('signed-in');

    return tokens;
  }, []);

  const completeGoogleLogin = useCallback(
    async (tokens: { accessToken: string; refreshToken: string }) => {
      saveTokens(tokens);

      const me = await authService.getCurrentUser();
      setUser(me);
      saveIdentity(me.id, me.email);
      setStatus('signed-in');

      return me;
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout(getRefreshToken());
    } catch (err) {
      /*
 * Sign-out should not fail because the server is unreachable.
 * Clear the local login data anyway, so the user is signed out on this device.
 */
      console.warn(extractErrorMessage(err, 'Logout request failed.'));
    } finally {
      clearTokens();
      setUser(null);
      setStatus('signed-out');
    }
  }, []);

  const value: AuthContextValue = {
    status,
    user,

    isAdmin: !!user?.roles?.includes('ADMIN'),
    login,
    completeGoogleLogin,
    logout,
    refreshUser: loadUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
