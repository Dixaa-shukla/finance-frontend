import { useState } from 'react';
import { Repeat, X } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { todayISO } from '@/utils/format';
import {
  hasIncomeErrors,
  validateIncomeForm,
  type IncomeFieldErrors,
} from '@/utils/incomeValidation';
import type { CategoryOption } from '@/types/category';
import { INCOME_SOURCES, type IncomeRequest } from '@/types/income';

/**
 * Add / edit dialog for POST /incomes and PUT /incomes/{id}.
 *
 * Every input maps to a field on IncomeRequest, and the maxLength on notes is
 * the @Size(max = 500) limit from that DTO, so the browser stops the user before
 * the server has to reject them. Validation still runs server-side as well.
 *
 * ⚠️ THE RECURRING CHECKBOX WRITES TO `isRecurring`, WHICH IS THE REQUEST-SIDE
 * NAME AND MUST ALWAYS BE SENT. The backend returns 500 if the key is missing
 * from the body — see the note at the top of types/income.ts.
 */
interface IncomeFormModalProps {
  title: string;
  submitLabel: string;
  initialValues: IncomeRequest;
  categories: CategoryOption[];
  onClose: () => void;
  onSubmit: (values: IncomeRequest) => Promise<void>;
}

function inputClasses(hasError: boolean) {
  return `w-full rounded-xl border bg-white/70 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-700/30 focus:bg-white ${
    hasError ? 'border-red-400' : 'border-sky-200'
  }`;
}

export function IncomeFormModal({
  title,
  submitLabel,
  initialValues,
  categories,
  onClose,
  onSubmit,
}: IncomeFormModalProps) {
  const [values, setValues] = useState<IncomeRequest>(initialValues);
  const [errors, setErrors] = useState<IncomeFieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function update<K extends keyof IncomeRequest>(
    key: K,
    value: IncomeRequest[K]
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const validationErrors = validateIncomeForm(values);
    setErrors(validationErrors);
    if (hasIncomeErrors(validationErrors)) return;

    setSubmitting(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6">
      {/* A real button, so the overlay can be dismissed by keyboard too. */}
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
          <div>
            <label
              htmlFor="income-amount"
              className="mb-1.5 block text-xs font-semibold text-navy-700/70"
            >
              Amount (₹) *
            </label>
            <input
              id="income-amount"
              type="number"
              min="0.01"
              step="0.01"
              value={values.amount ?? ''}
              onChange={(e) =>
                update(
                  'amount',
                  e.target.value === '' ? null : Number(e.target.value)
                )
              }
              className={inputClasses(!!errors.amount)}
              aria-invalid={!!errors.amount}
            />
            {errors.amount && (
              <p className="mt-1 text-xs text-red-500">{errors.amount}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="income-date"
              className="mb-1.5 block text-xs font-semibold text-navy-700/70"
            >
              Date *
            </label>
            <input
              id="income-date"
              type="date"
              max={todayISO()}
              value={values.incomeDate}
              onChange={(e) => update('incomeDate', e.target.value)}
              className={inputClasses(!!errors.incomeDate)}
              aria-invalid={!!errors.incomeDate}
            />
            {errors.incomeDate && (
              <p className="mt-1 text-xs text-red-500">{errors.incomeDate}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="income-source"
              className="mb-1.5 block text-xs font-semibold text-navy-700/70"
            >
              Source *
            </label>
            {/* A fixed backend enum, so a dropdown is the only valid control. */}
            <select
              id="income-source"
              value={values.source}
              onChange={(e) =>
                update('source', e.target.value as IncomeRequest['source'])
              }
              className={inputClasses(!!errors.source)}
            >
              {INCOME_SOURCES.map((source) => (
                <option key={source.value} value={source.value}>
                  {source.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="income-category"
              className="mb-1.5 block text-xs font-semibold text-navy-700/70"
            >
              Category
            </label>
            {/*
              Optional on IncomeRequest, and the server requires any id given to
              be a real category of type INCOME — so this is a picker built from
              the user's actual INCOME categories, never a free-text id.
            */}
            <select
              id="income-category"
              value={values.categoryId === null ? '' : String(values.categoryId)}
              onChange={(e) =>
                update(
                  'categoryId',
                  e.target.value === '' ? null : Number(e.target.value)
                )
              }
              className={inputClasses(false)}
              disabled={categories.length === 0}
            >
              <option value="">
                {categories.length === 0 ? 'No income categories yet' : 'None'}
              </option>
              {categories.map((category) => (
                <option key={category.id} value={String(category.id)}>
                  {category.name}
                </option>
              ))}
            </select>
            {categories.length === 0 && (
              <p className="mt-1 text-xs text-navy-700/45">
                Income categories are managed in Category Management.
              </p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="income-notes"
              className="mb-1.5 block text-xs font-semibold text-navy-700/70"
            >
              Notes
            </label>
            <textarea
              id="income-notes"
              rows={3}
              maxLength={500}
              value={values.notes ?? ''}
              onChange={(e) => update('notes', e.target.value || null)}
              placeholder="Anything worth remembering about this income"
              className={inputClasses(!!errors.notes)}
            />
            {errors.notes && (
              <p className="mt-1 text-xs text-red-500">{errors.notes}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="income-recurring"
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-sky-200 bg-white/70 p-4"
            >
              <input
                id="income-recurring"
                type="checkbox"
                checked={values.isRecurring}
                onChange={(e) => update('isRecurring', e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-sky-300 text-brand-blue"
              />
              <span>
                <span className="flex items-center gap-1.5 text-sm font-semibold text-navy-900">
                  <Repeat className="h-3.5 w-3.5 text-brand-purple" />
                  This income repeats
                </span>
                <span className="mt-0.5 block text-xs text-navy-700/50">
                  Mark salary or rent so it can be told apart from one-off
                  earnings.
                </span>
              </span>
            </label>
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
