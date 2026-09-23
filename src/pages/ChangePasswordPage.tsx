import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft, KeyRound, Lock } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthInput } from '@/components/auth/AuthInput';
import { Button } from '@/components/common/Button';
import { authService } from '@/api/authService';
import { extractErrorMessage, extractFieldErrors } from '@/api/axiosClient';
import { setAuthNotice } from '@/api/tokenStorage';
import { useAuth } from '@/hooks/useAuth';
import {
  hasAuthErrors,
  passwordStrength,
  validateChangePasswordForm,
  type AuthFieldErrors,
} from '@/utils/authValidation';

/**
 * Module 1 — Authentication & Security. Change password for a signed-in user.
 */
export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const strength = passwordStrength(newPassword);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const found = validateChangePasswordForm({
      currentPassword,
      newPassword,
      confirmPassword,
    });
    setErrors(found);
    if (hasAuthErrors(found)) return;

    setSubmitting(true);
    try {
      await authService.changePassword({ currentPassword, newPassword });

      /*
 * Set the logout message before calling logout().
 * ProtectedRoute handles the redirect after logout, so navigate() state can be
 * lost. The message is stored separately and LoginPage shows it once.
 */
      setAuthNotice(
        'Password changed. For your security every device was signed out — please sign in again.'
      );

      
      await logout();

     // Fallback redirect in case ProtectedRoute has not redirected yet.
// If the redirect already happened, this does nothing.
      navigate('/login', { replace: true });
    } catch (err) {
      /*
       * The backend answers 401 "Current password is incorrect" here
       */
      const fieldErrors = extractFieldErrors(err);
      if (fieldErrors) {
        setErrors(fieldErrors);
      } else {
        const message = extractErrorMessage(
          err,
          'Could not change your password. Please try again.'
        );
        if (message.toLowerCase().includes('current password')) {
          setErrors({ currentPassword: message });
        } else {
          setFormError(message);
        }
      }
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Change password"
      subtitle={
        user ? `Update the password for ${user.email}` : 'Update your password'
      }
      footer={
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 font-semibold text-brand-blue hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to dashboard
        </Link>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <AuthInput
          label="Current password"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          icon={<KeyRound className="h-4 w-4" />}
          showPasswordToggle
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          error={errors.currentPassword}
          disabled={submitting}
        />

        <div>
          <AuthInput
            label="New password"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            icon={<Lock className="h-4 w-4" />}
            showPasswordToggle
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            error={errors.newPassword}
            hint="At least 8 characters, with an uppercase letter, a lowercase letter and a digit."
            disabled={submitting}
          />
          {newPassword && !errors.newPassword && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex flex-1 gap-1">
                {[1, 2, 3].map((bar) => (
                  <div
                    key={bar}
                    className={`h-1 flex-1 rounded-pill transition-colors ${
                      strength.score >= bar
                        ? ['', 'bg-red-400', 'bg-amber-400', 'bg-brand-green'][
                            strength.score
                          ]
                        : 'bg-sky-200'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[11px] font-semibold text-navy-700/50">
                {strength.label}
              </span>
            </div>
          )}
        </div>

        <AuthInput
          label="Confirm new password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          icon={<Lock className="h-4 w-4" />}
          showPasswordToggle
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
          disabled={submitting}
        />

        {/* Stated up front, because it is surprising and irreversible. */}
        <p className="rounded-xl bg-sky-100/70 px-3.5 py-2.5 text-[11px] leading-relaxed text-navy-700/70">
          Changing your password signs you out of every device, including this one.
          You'll sign in again with the new password.
        </p>

        {formError && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-500"
          >
            {formError}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Changing password…' : 'Change Password'}
        </Button>
      </form>
    </AuthLayout>
  );
}
