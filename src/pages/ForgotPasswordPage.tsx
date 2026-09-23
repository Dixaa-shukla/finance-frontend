import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, Mail, MailCheck } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthInput } from '@/components/auth/AuthInput';
import { Button } from '@/components/common/Button';
import { authService } from '@/api/authService';
import { extractErrorMessage, extractFieldErrors } from '@/api/axiosClient';
import {
  hasAuthErrors,
  validateForgotPasswordForm,
  type AuthFieldErrors,
} from '@/utils/authValidation';

/**
 * Module 1 — Authentication & Security. POST /api/v1/auth/forgot-password
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);

    const nextErrors = validateForgotPasswordForm({ email });
    setErrors(nextErrors);
    if (hasAuthErrors(nextErrors)) return;

    setSubmitting(true);
    try {
      await authService.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      const fieldErrors = extractFieldErrors(err);
      if (fieldErrors) setErrors(fieldErrors);
      setSubmitError(
        extractErrorMessage(err, 'Unable to send the reset link. Please try again.')
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

  
  if (sent) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle="A password reset link is on its way"
        footer={backLink}
      >
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-blue to-brand-purple text-white shadow-soft">
            <MailCheck className="h-7 w-7" />
          </div>

          <p className="mt-5 text-sm leading-relaxed text-navy-700/70">
            If an account exists for{' '}
            <span className="font-semibold text-navy-900">{email.trim()}</span>,
            we&apos;ve sent it a link to choose a new password.
          </p>

          <p className="mt-3 text-xs text-navy-700/50">
            The link is valid for 60 minutes and can only be used once. Check your
            spam folder if it hasn&apos;t arrived in a few minutes.
          </p>

          <Button
            variant="secondary"
            className="mt-6 w-full"
            onClick={() => setSent(false)}
          >
            Use a different email
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot password?"
      subtitle="Enter your email and we'll send you a reset link"
      footer={backLink}
    >
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
          autoFocus
        />

        {submitError && (
          <div className="mt-5 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">
            {submitError}
          </div>
        )}

        <Button type="submit" loading={submitting} className="mt-6 w-full">
          {submitting ? 'Sending…' : 'Send Reset Link'}
        </Button>
      </form>
    </AuthLayout>
  );
}
