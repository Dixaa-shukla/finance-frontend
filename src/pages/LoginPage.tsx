import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { CircleCheck, Lock, Mail } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthDivider, GoogleButton } from '@/components/auth/GoogleButton';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';
import { extractErrorMessage, extractFieldErrors } from '@/api/axiosClient';
import {
  getRememberedEmail,
  setRememberedEmail,
  takeAuthNotice,
} from '@/api/tokenStorage';
import {
  hasAuthErrors,
  validateLoginForm,
  type AuthFieldErrors,
} from '@/utils/authValidation';

/**
 * Module 1 — Authentication & Security. POST /api/v1/auth/login
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const remembered = getRememberedEmail();

  const [email, setEmail] = useState(remembered ?? '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(!!remembered);
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /*
 * Messages passed from other screens through navigate(..., { state }):
 * notice — messages like "Account created" or "Password updated"
 * from — the protected page the user originally tried to open
 */
  const state = location.state as
    | { notice?: string; from?: { pathname?: string } }
    | null;
 /*
 * Checks router state first, then sessionStorage for messages.
 * sessionStorage is needed when ProtectedRoute handles a forced logout redirect
 * and replaces the state passed by the previous page.
 */
  const notice = state?.notice ?? takeAuthNotice();
  const redirectTo = state?.from?.pathname ?? '/';

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);

    const nextErrors = validateLoginForm({ email, password });
    setErrors(nextErrors);
    if (hasAuthErrors(nextErrors)) return;

    setSubmitting(true);
    try {
      await login(email.trim(), password);

      setRememberedEmail(rememberMe ? email.trim() : null);

      // replace: true so Back doesn't return to the sign-in form.
      navigate('/login-success', { replace: true, state: { redirectTo } });
    } catch (err) {
      /*
 * Handles two types of errors:
 *  - 400 validation errors are shown for the related fields.
 *  - 401 login errors show the backend's message as-is.
 * The generic login message avoids revealing whether the email or password is wrong.
 */
      const fieldErrors = extractFieldErrors(err);
      if (fieldErrors) setErrors(fieldErrors);

      setSubmitError(extractErrorMessage(err, 'Unable to sign in. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your NOVA account to continue"
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="font-semibold text-brand-blue hover:underline"
          >
            Sign up
          </Link>
        </>
      }
    >
      {notice && (
        <div className="mb-5 flex items-start gap-2 rounded-xl bg-brand-green/10 px-4 py-2.5 text-sm text-brand-green">
          <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      <GoogleButton disabled={submitting} />
      <AuthDivider label="or sign in with email" />

      <form onSubmit={handleSubmit} noValidate>
        <AuthInput
          label="Email address"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@example.com"
          icon={<Mail className="h-4 w-4" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          disabled={submitting}
        />

        <AuthInput
          className="mt-4"
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          icon={<Lock className="h-4 w-4" />}
          showPasswordToggle
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          disabled={submitting}
        />

        <div className="mt-4 flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-navy-700/70">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-sky-200 text-brand-blue accent-brand-blue"
            />
            Remember me
          </label>

          <Link
            to="/forgot-password"
            className="text-xs font-semibold text-brand-blue hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        {submitError && (
          <div className="mt-5 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">
            {submitError}
          </div>
        )}

        <Button type="submit" loading={submitting} className="mt-6 w-full">
          {submitting ? 'Signing in…' : 'Sign In'}
        </Button>
      </form>
    </AuthLayout>
  );
}
