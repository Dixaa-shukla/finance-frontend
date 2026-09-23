import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { extractErrorMessage } from '@/api/axiosClient';
import {
  hasGoalErrors,
  validateGoalForm,
  type GoalFieldErrors,
} from '@/utils/goalValidation';
import { todayISO } from '@/utils/format';
import type { GoalRequest } from '@/types/goal';

/**
 * Add / edit dialog for POST /goals and PUT /goals/{id}.
 *
 * Both routes take the same GoalRequest, so one form serves both — the page
 * decides which service call the submit handler makes.
 *
 * ⚠️ THERE IS NO SAVED-AMOUNT FIELD, ON PURPOSE. GoalServiceImpl.updateGoal
 * writes title/description/targetAmount/targetDate and leaves currentAmount
 * alone ("only contributeToGoal changes it"), and currentAmount is not on
 * GoalRequest at all. A field for it here would silently do nothing.
 *
 * ⚠️ THE DATE INPUT CARRIES min=today. GoalRequest.targetDate is @FutureOrPresent
 * — the reverse of the @PastOrPresent expense and income dates — so a past date
 * is a 400. Both the input and validateGoalForm block it.
 */
interface GoalFormModalProps {
  title: string;
  submitLabel: string;
  initialValues: GoalRequest;
  onClose: () => void;
  onSubmit: (values: GoalRequest) => Promise<void>;
}

function inputClasses(hasError: boolean) {
  return `w-full rounded-xl border bg-white/70 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-700/30 focus:bg-white ${
    hasError ? 'border-red-400' : 'border-sky-200'
  }`;
}

const labelClasses = 'mb-1.5 block text-xs font-semibold text-navy-700/70';

export function GoalFormModal({
  title,
  submitLabel,
  initialValues,
  onClose,
  onSubmit,
}: GoalFormModalProps) {
  const [values, setValues] = useState<GoalRequest>(initialValues);
  const [errors, setErrors] = useState<GoalFieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function update<K extends keyof GoalRequest>(key: K, value: GoalRequest[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const validationErrors = validateGoalForm(values);
    setErrors(validationErrors);
    if (hasGoalErrors(validationErrors)) return;

    setSubmitting(true);
    try {
      // Trim the title because @NotBlank passes on " x " but the stored value
      // would keep the padding, and send null rather than "" for the optional
      // description so the row reads as "not set" instead of "set to empty".
      await onSubmit({
        ...values,
        title: values.title.trim(),
        description:
          values.description && values.description.trim()
            ? values.description.trim()
            : null,
      });
    } catch (err) {
      // The readable message from the backend is in the response body, not on
      // the AxiosError. This line outlives the toast, so it has to be the
      // informative one.
      setSubmitError(
        extractErrorMessage(err, 'Something went wrong. Please try again.')
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="fixed inset-0 bg-navy-900/30 backdrop-blur-sm"
      />

      <form
        onSubmit={handleSubmit}
        noValidate
        className="glass-card relative z-10 my-auto w-full max-w-2xl p-6 sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-bold text-navy-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-navy-700/50 hover:bg-sky-100 hover:text-navy-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="goal-title" className={labelClasses}>
              Title *
            </label>
            <input
              id="goal-title"
              type="text"
              maxLength={100}
              value={values.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="Emergency fund"
              className={inputClasses(!!errors.title)}
              aria-invalid={!!errors.title}
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-500">{errors.title}</p>
            )}
          </div>

          <div>
            <label htmlFor="goal-target-amount" className={labelClasses}>
              Target amount (₹) *
            </label>
            <input
              id="goal-target-amount"
              type="number"
              min="0.01"
              step="0.01"
              value={values.targetAmount ?? ''}
              onChange={(e) =>
                update(
                  'targetAmount',
                  e.target.value === '' ? null : Number(e.target.value)
                )
              }
              placeholder="200000"
              className={inputClasses(!!errors.targetAmount)}
              aria-invalid={!!errors.targetAmount}
            />
            {errors.targetAmount && (
              <p className="mt-1 text-xs text-red-500">{errors.targetAmount}</p>
            )}
          </div>

          <div>
            <label htmlFor="goal-target-date" className={labelClasses}>
              Target date *
            </label>
            {/* min=today mirrors @FutureOrPresent — see the note up top. */}
            <input
              id="goal-target-date"
              type="date"
              min={todayISO()}
              value={values.targetDate}
              onChange={(e) => update('targetDate', e.target.value)}
              className={inputClasses(!!errors.targetDate)}
              aria-invalid={!!errors.targetDate}
            />
            {errors.targetDate ? (
              <p className="mt-1 text-xs text-red-500">{errors.targetDate}</p>
            ) : (
              <p className="mt-1 text-xs text-navy-700/45">
                Today or later. The backend rejects a past date.
              </p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="goal-description" className={labelClasses}>
              Description
            </label>
            <textarea
              id="goal-description"
              rows={3}
              maxLength={500}
              value={values.description ?? ''}
              onChange={(e) => update('description', e.target.value || null)}
              placeholder="Why this goal matters, or how you plan to fund it"
              className={inputClasses(!!errors.description)}
              aria-invalid={!!errors.description}
            />
            {errors.description ? (
              <p className="mt-1 text-xs text-red-500">{errors.description}</p>
            ) : (
              <p className="mt-1 text-xs text-navy-700/45">
                Optional. {(values.description ?? '').length}/500
              </p>
            )}
          </div>

          {/*
            Stated because it is the one thing about this form that would
            otherwise surprise: there is no field for what has already been saved.
          */}
          <p className="rounded-xl bg-sky-50 px-3.5 py-2.5 text-xs text-navy-700/60 sm:col-span-2">
            Money saved is tracked separately — use{' '}
            <strong className="font-semibold text-navy-900">Contribute</strong> on
            the goal card. Editing a goal never changes the amount already saved.
          </p>
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
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
