import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Lock, Mail, User } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthDivider, GoogleButton } from '@/components/auth/GoogleButton';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/api/authService';
import { profileService } from '@/api/profileService';
import { extractErrorMessage, extractFieldErrors } from '@/api/axiosClient';
import {
  hasAuthErrors,
  passwordStrength,
  validateRegisterForm,
  type AuthFieldErrors,
} from '@/utils/authValidation';

/**
 * Module 1 — Authentication & Security. POST /api/v1/auth/register
 *
 * THIS SCREEN MAKES UP TO THREE CALLS, BECAUSE THE BACKEND SPLITS THE WORK:
 *   1. POST /api/v1/auth/register  → 201 UserResponse, NO tokens
 *   2. POST /api/v1/auth/login     → the tokens
 *   3. POST /api/v1/profiles       → stores the full name (Module 2)
 */
export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const strength = passwordStrength(password);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);

    const nextErrors = validateRegisterForm({
      fullName,
      email,
      password,
      confirmPassword,
      acceptTerms,
    });
    setErrors(nextErrors);
    if (hasAuthErrors(nextErrors)) return;

    setSubmitting(true);
    try {
      // 1. Create the account.
      await authService.register({ email: email.trim(), password });

      // 2. Sign in with the same credentials to get tokens.
      const tokens = await login(email.trim(), password);

      // 3. Store the name. Best-effort .
      try {
        await profileService.create({
          userId: tokens.userId,
          fullName: fullName.trim(),
          
          preferredCurrency: 'INR',
        });
      } catch (profileErr) {
        console.warn(
          'Account created, but the profile could not be saved:',
          extractErrorMessage(profileErr, 'Unknown error')
        );
      }

      navigate('/login-success', { replace: true, state: { redirectTo: '/' } });
    } catch (err) {
      const fieldErrors = extractFieldErrors(err);
      if (fieldErrors) setErrors(fieldErrors);

      // 409 EmailAlreadyExistsException →
      // "An account already exists with email: ..." — shown as-is.
      setSubmitError(
        extractErrorMessage(err, 'Unable to create your account. Please try again.')
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start tracking your money with NOVA in under a minute"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-blue hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <GoogleButton label="Sign up with Google" disabled={submitting} />
      <AuthDivider label="or sign up with email" />

      <form onSubmit={handleSubmit} noValidate>
        <AuthInput
          label="Full name"
          name="fullName"
          autoComplete="name"
          placeholder="Ada Lovelace"
          icon={<User className="h-4 w-4" />}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          error={errors.fullName}
          disabled={submitting}
        />

        <AuthInput
          className="mt-4"
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
          autoComplete="new-password"
          placeholder="At least 8 characters"
          icon={<Lock className="h-4 w-4" />}
          showPasswordToggle
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          disabled={submitting}
          hint={<StrengthMeter score={strength.score} label={strength.label} />}
        />

        <AuthInput
          className="mt-4"
          label="Confirm password"
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          icon={<Lock className="h-4 w-4" />}
          showPasswordToggle
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
          disabled={submitting}
        />

        <div className="mt-5">
          <label className="flex cursor-pointer items-start gap-2.5 text-xs font-medium text-navy-700/70">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              disabled={submitting}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-sky-200 accent-brand-blue"
            />
            <span>
              I agree to the{' '}
              <span className="font-semibold text-brand-blue">Terms of Service</span>{' '}
              and{' '}
              <span className="font-semibold text-brand-blue">Privacy Policy</span>
            </span>
          </label>
          {errors.acceptTerms && (
            <p className="mt-1 text-xs text-red-500">{errors.acceptTerms}</p>
          )}
        </div>

        {submitError && (
          <div className="mt-5 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">
            {submitError}
          </div>
        )}

        <Button type="submit" loading={submitting} className="mt-6 w-full">
          {submitting ? 'Creating account…' : 'Create Account'}
        </Button>
      </form>
    </AuthLayout>
  );
}

/** Three bars matching the three things the backend's @Pattern requires. */
function StrengthMeter({ score, label }: { score: number; label: string }) {
  if (!label) return null;

  const barColour = ['', 'bg-red-400', 'bg-amber-400', 'bg-brand-green'][score];

  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="flex flex-1 gap-1">
        {[1, 2, 3].map((step) => (
          <span
            key={step}
            className={`h-1 flex-1 rounded-full ${
              step <= score ? barColour : 'bg-sky-200'
            }`}
          />
        ))}
      </div>
      <span className="text-[11px] font-semibold text-navy-700/50">{label}</span>
    </div>
  );
}
