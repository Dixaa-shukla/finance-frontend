import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { ArrowLeft, TriangleAlert } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthLoadingScreen } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';
import { extractErrorMessage } from '@/api/axiosClient';

/** The exact codes the backend can send, turned into something a person can read. */
const ERROR_MESSAGES: Record<string, string> = {
  // SecurityConfig failureUrl — Google denied consent, or the handshake failed.
  oauth2_failed:
    'Google sign-in was cancelled or could not be completed. Please try again.',
  // OAuth2LoginSuccessHandler:115 — the `email` scope was narrowed.
  oauth2_missing_email:
    'Google did not share an email address with us, so the account could not be created.',
  // OAuth2LoginSuccessHandler:127 — disabled account, or unverified Google email.
  oauth2_login_rejected:
    'This Google account cannot be used to sign in. If you already have a NOVA account, sign in with your email and password.',
  // OAuth2LoginSuccessHandler:95 — should not happen; kept so it never shows a blank error.
  oauth2_unexpected_principal:
    'Something went wrong while completing Google sign-in. Please try again.',
};

export default function OAuth2CallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { completeGoogleLogin } = useAuth();

  const errorCode = searchParams.get('error');
  const accessToken = searchParams.get('accessToken');
  const refreshToken = searchParams.get('refreshToken');

  /*
 * These values are calculated directly from the URL.
 * Only the /auth/me result needs state because it comes from an API call.
 */
  const urlError = errorCode
    ? (ERROR_MESSAGES[errorCode] ??
      'Google sign-in failed. Please try again or use your email and password.')
    : !accessToken || !refreshToken
      ? // Reached /oauth2/callback directly, with no redirect behind it.
        'This page is only reachable through Google sign-in.'
      : null;

  const [loadError, setLoadError] = useState<string | null>(null);
  const error = urlError ?? loadError;

  
  const handled = useRef(false);

  useEffect(() => {
    if (urlError) return;
    if (!accessToken || !refreshToken) return;
    if (handled.current) return;
    handled.current = true;

    completeGoogleLogin({ accessToken, refreshToken })
      .then(() => {
        /*
 * replace: true removes the token URL from browser history, so the Back button
 * cannot return to it. The tokens may still briefly appear in the address bar.
 */
        navigate('/login-success', { replace: true, state: { redirectTo: '/' } });
      })
      .catch((err) => {
        setLoadError(
          extractErrorMessage(
            err,
            'Signed in with Google, but your account could not be loaded. Please try again.'
          )
        );
      });
  }, [urlError, accessToken, refreshToken, completeGoogleLogin, navigate]);

  if (error) {
    return (
      <AuthLayout
        title="Sign-in failed"
        subtitle="We couldn't finish signing you in with Google"
        footer={
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 font-semibold text-brand-blue hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Sign In
          </Link>
        }
      >
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-500">
            <TriangleAlert className="h-7 w-7" />
          </div>
          <p className="mt-5 text-sm leading-relaxed text-navy-700/70">{error}</p>
          <Button className="mt-6 w-full" onClick={() => navigate('/login')}>
            Try again
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return <AuthLoadingScreen />;
}
