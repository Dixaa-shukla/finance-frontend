import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthLoadingScreen } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';

/** Seconds shown on the countdown before the automatic redirect. */
const REDIRECT_SECONDS = 3;

/**
 * Module 1 — Authentication & Security. The "you're in" confirmation.
 */
export default function LoginSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { status, user } = useAuth();

  const state = location.state as { redirectTo?: string } | null;
  const redirectTo = state?.redirectTo ?? '/';

  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    if (status !== 'signed-in') return;

    if (secondsLeft <= 0) {
      navigate(redirectTo, { replace: true });
      return;
    }

   // Uses one timer per tick.
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft, status, navigate, redirectTo]);

  // Still verifying the stored token.
  if (status === 'loading') return <AuthLoadingScreen />;

  // Somebody opened /login-success without signing in.
  if (status === 'signed-out') return <Navigate to="/login" replace />;

  return (
    <AuthLayout
      title="You're signed in"
      subtitle="Welcome back to NOVA AI Finance"
    >
      <div className="flex flex-col items-center text-center">
        {/* Success mark — the gradient badge from the reference design */}
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue via-brand-purple to-brand-cyan text-white shadow-soft">
            <Check className="h-9 w-9" strokeWidth={3} />
          </div>
          {/* Soft halo */}
          <span
            aria-hidden="true"
            className="absolute inset-0 -z-10 rounded-full bg-brand-purple/30 blur-2xl"
          />
          <Sparkles
            aria-hidden="true"
            className="absolute -right-3 -top-2 h-5 w-5 text-brand-cyan"
          />
          <Sparkles
            aria-hidden="true"
            className="absolute -bottom-1 -left-3 h-4 w-4 text-brand-purple"
          />
        </div>

        {user && (
          <p className="mt-6 text-sm text-navy-700/70">
            Signed in as{' '}
            <span className="font-semibold text-navy-900">{user.email}</span>
          </p>
        )}

        <Button
          className="mt-6 w-full"
          icon={<ArrowRight className="h-4 w-4" />}
          onClick={() => navigate(redirectTo, { replace: true })}
        >
          Go to Dashboard
        </Button>

        <p className="mt-4 text-xs text-navy-700/50" aria-live="polite">
          Redirecting automatically in {secondsLeft}s…
        </p>
      </div>
    </AuthLayout>
  );
}
