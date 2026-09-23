import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { validateProfileForm, hasErrors, type FieldErrors } from '@/utils/validation';
import type { ProfileRequest } from '@/types/profile';

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'];

interface ProfileEditFormProps {
  userId: number;
  initialValues: ProfileRequest;
  submitLabel?: string;
  onCancel?: () => void;
  onSubmit: (values: ProfileRequest) => Promise<void>;
}

function inputClasses(hasError: boolean) {
  return `w-full rounded-xl border bg-white/70 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-700/30 focus:bg-white ${
    hasError ? 'border-red-400' : 'border-sky-200'
  }`;
}

export function ProfileEditForm({
  userId,
  initialValues,
  submitLabel = 'Save Changes',
  onCancel,
  onSubmit,
}: ProfileEditFormProps) {
  const [values, setValues] = useState<ProfileRequest>(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function update<K extends keyof ProfileRequest>(key: K, value: ProfileRequest[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const validationErrors = validateProfileForm(values);
    setErrors(validationErrors);
    if (hasErrors(validationErrors)) return;

    setSubmitting(true);
    try {
      await onSubmit({ ...values, userId });
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card p-6 sm:p-8" noValidate>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="fullName" className="mb-1.5 block text-xs font-semibold text-navy-700/70">
            Full Name *
          </label>
          <input
            id="fullName"
            type="text"
            maxLength={100}
            value={values.fullName}
            onChange={(e) => update('fullName', e.target.value)}
            className={inputClasses(!!errors.fullName)}
            aria-invalid={!!errors.fullName}
            aria-describedby={errors.fullName ? 'fullName-error' : undefined}
          />
          {errors.fullName && (
            <p id="fullName-error" className="mt-1 text-xs text-red-500">
              {errors.fullName}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="phoneNumber" className="mb-1.5 block text-xs font-semibold text-navy-700/70">
            Phone Number
          </label>
          <input
            id="phoneNumber"
            type="tel"
            placeholder="+91 98765 43210"
            value={values.phoneNumber ?? ''}
            onChange={(e) => update('phoneNumber', e.target.value || null)}
            className={inputClasses(!!errors.phoneNumber)}
            aria-invalid={!!errors.phoneNumber}
          />
          {errors.phoneNumber && (
            <p className="mt-1 text-xs text-red-500">{errors.phoneNumber}</p>
          )}
        </div>

        <div>
          <label htmlFor="dateOfBirth" className="mb-1.5 block text-xs font-semibold text-navy-700/70">
            Date of Birth
          </label>
          <input
            id="dateOfBirth"
            type="date"
            max={new Date().toISOString().split('T')[0]}
            value={values.dateOfBirth ?? ''}
            onChange={(e) => update('dateOfBirth', e.target.value || null)}
            className={inputClasses(!!errors.dateOfBirth)}
            aria-invalid={!!errors.dateOfBirth}
          />
          {errors.dateOfBirth && (
            <p className="mt-1 text-xs text-red-500">{errors.dateOfBirth}</p>
          )}
        </div>

        <div>
          <label htmlFor="gender" className="mb-1.5 block text-xs font-semibold text-navy-700/70">
            Gender
          </label>
          <select
            id="gender"
            value={values.gender ?? ''}
            onChange={(e) => update('gender', e.target.value || null)}
            className={inputClasses(!!errors.gender)}
          >
            <option value="">Select gender</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
            <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
          </select>
        </div>

        <div>
          <label htmlFor="monthlySalary" className="mb-1.5 block text-xs font-semibold text-navy-700/70">
            Monthly Salary
          </label>
          <input
            id="monthlySalary"
            type="number"
            min={0}
            step="0.01"
            value={values.monthlySalary ?? ''}
            onChange={(e) =>
              update('monthlySalary', e.target.value === '' ? null : Number(e.target.value))
            }
            className={inputClasses(!!errors.monthlySalary)}
            aria-invalid={!!errors.monthlySalary}
          />
          {errors.monthlySalary && (
            <p className="mt-1 text-xs text-red-500">{errors.monthlySalary}</p>
          )}
        </div>

        <div>
          <label htmlFor="preferredCurrency" className="mb-1.5 block text-xs font-semibold text-navy-700/70">
            Preferred Currency *
          </label>
          <select
            id="preferredCurrency"
            value={values.preferredCurrency}
            onChange={(e) => update('preferredCurrency', e.target.value)}
            className={inputClasses(!!errors.preferredCurrency)}
            aria-invalid={!!errors.preferredCurrency}
          >
            {CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
          {errors.preferredCurrency && (
            <p className="mt-1 text-xs text-red-500">{errors.preferredCurrency}</p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="primaryFinancialGoal" className="mb-1.5 block text-xs font-semibold text-navy-700/70">
            Primary Financial Goal
          </label>
          <textarea
            id="primaryFinancialGoal"
            rows={3}
            maxLength={255}
            placeholder="e.g. Save ₹5,00,000 for a home down payment by 2027"
            value={values.primaryFinancialGoal ?? ''}
            onChange={(e) => update('primaryFinancialGoal', e.target.value || null)}
            className={inputClasses(!!errors.primaryFinancialGoal)}
          />
          {errors.primaryFinancialGoal && (
            <p className="mt-1 text-xs text-red-500">{errors.primaryFinancialGoal}</p>
          )}
        </div>
      </div>

      {submitError && (
        <p className="mt-5 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">
          {submitError}
        </p>
      )}

      <div className="mt-7 flex items-center gap-3">
        <Button type="submit" loading={submitting}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}