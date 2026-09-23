import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

/**
 * Module 1 — Authentication & Security.
 *
 * Gates every dashboard route.
 *
 * ⚠️ THE `status === 'loading'` BRANCH IS NOT OPTIONAL. On a hard refresh the
 * provider starts in 'loading' while GET /auth/me is in flight. If this component
 * treated "no user yet" as "signed out", every refresh would throw a signed-in
 * user back to /login. It must WAIT.
 *
 * `state={{ from: location }}` lets LoginPage send the user back to the page they
 * actually wanted after signing in, instead of always dumping them on "/".
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <AuthLoadingScreen />;
  }

  if (status === 'signed-out') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}

/**
 * Keeps the NOVA identity on screen during the /auth/me check, so the app never
 * flashes a blank white page between routes.
 */
export function AuthLoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-blue to-brand-purple text-white shadow-soft">
        <Sparkles className="h-5 w-5" />
      </div>
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-blue/25 border-t-brand-blue" />
      <p className="text-xs font-medium uppercase tracking-wide text-navy-700/50">
        Signing you in
      </p>
    </div>
  );
}

/**
 * The mirror of ProtectedRoute: keeps an already-signed-in user off /login and
 * /register, so the back button after signing in doesn't land on a sign-in form.
 */
export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth();

  if (status === 'loading') {
    return <AuthLoadingScreen />;
  }

  if (status === 'signed-in') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
