import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { ArrowLeft, KeyRound, Lock, TriangleAlert } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthInput } from '@/components/auth/AuthInput';
import { Button } from '@/components/common/Button';
import { authService } from '@/api/authService';
import { extractErrorMessage, extractFieldErrors } from '@/api/axiosClient';
import {
  hasAuthErrors,
  passwordStrength,
  validateResetPasswordForm,
  type AuthFieldErrors,
} from '@/utils/authValidation';

/**
 * Module 1 — Authentication & Security. POST /api/v1/auth/reset-password
 */
export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const strength = passwordStrength(newPassword);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);

    const nextErrors = validateResetPasswordForm({ newPassword, confirmPassword });
    setErrors(nextErrors);
    if (hasAuthErrors(nextErrors)) return;

    setSubmitting(true);
    try {
      await authService.resetPassword({ token: token as string, newPassword });

      navigate('/login', {
        replace: true,
        state: { notice: 'Password updated. Sign in with your new password.' },
      });
    } catch (err) {
      const fieldErrors = extractFieldErrors(err);
      if (fieldErrors) setErrors(fieldErrors);

      // 400 InvalidTokenException →
      // "Password reset link is invalid, expired, or has already been used"
      setSubmitError(
        extractErrorMessage(err, 'Unable to reset your password. Please try again.')
      );
    } finally {
      setSubmitting(false);
    }
  }

  const backLink = (
    <Link
      to="/login"
      className="inline-flex items-center gap-1.5 font-semibold text-brand-blue hover:underline"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      Back to Sign In
    </Link>
  );

  // Someone opened /reset-password by hand. Say so plainly instead of showing a
  // form that is guaranteed to fail on submit.
  if (!token) {
    return (
      <AuthLayout
        title="Link not valid"
        subtitle="This page needs a reset token"
        footer={backLink}
      >
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
            <TriangleAlert className="h-7 w-7" />
          </div>
          <p className="mt-5 text-sm leading-relaxed text-navy-700/70">
            Open the link from your password reset email, or request a new one.
          </p>
          <Button
            className="mt-6 w-full"
            onClick={() => navigate('/forgot-password')}
          >
            Request a new link
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Set a new password"
      subtitle="Choose a password you haven't used before"
      footer={backLink}
    >
      <div className="mb-6 flex justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-blue to-brand-purple text-white shadow-soft">
          <KeyRound className="h-6 w-6" />
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <AuthInput
          label="New password"
          type="password"
          name="newPassword"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          icon={<Lock className="h-4 w-4" />}
          showPasswordToggle
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          error={errors.newPassword}
          disabled={submitting}
          hint={
            strength.label ? (
              <p className="mt-1.5 text-[11px] font-semibold text-navy-700/50">
                Strength: {strength.label}
              </p>
            ) : null
          }
        />

        <AuthInput
          className="mt-4"
          label="Confirm new password"
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="Re-enter your new password"
          icon={<Lock className="h-4 w-4" />}
          showPasswordToggle
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
          disabled={submitting}
        />

        {submitError && (
          <div className="mt-5 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">
            {submitError}
          </div>
        )}

        <Button type="submit" loading={submitting} className="mt-6 w-full">
          {submitting ? 'Updating…' : 'Reset Password'}
        </Button>

        <p className="mt-4 text-center text-xs text-navy-700/50">
          You&apos;ll be signed out everywhere and asked to sign in again.
        </p>
      </form>
    </AuthLayout>
  );
}
