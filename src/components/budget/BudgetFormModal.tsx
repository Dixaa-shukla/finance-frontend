import { useState } from 'react';
import { Info, X } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { extractErrorMessage } from '@/api/axiosClient';
import {
  hasBudgetErrors,
  validateBudgetForm,
  type BudgetFieldErrors,
} from '@/utils/budgetValidation';
import { BUDGET_PERIODS, type BudgetRequest } from '@/types/budget';
import type { CategoryOption } from '@/types/category';

/**
 * Add / edit dialog for POST /budgets and PUT /budgets/{id}.
 *
 * Both routes take the same BudgetRequest and PUT replaces every field, so one
 * form serves both — the page decides which service call the submit handler makes.
 *
 * ⚠️ THE START DATE HAS NO `max`. BudgetRequest.startDate is only @NotNull, while
 * ExpenseRequest.expenseDate and IncomeRequest.incomeDate are @PastOrPresent.
 * Budgeting a month that has not started yet is normal, so capping this at today
 * would block something the API accepts.
 *
 * ⚠️ THE CATEGORY PICKER IS EXPENSE-ONLY. BudgetServiceImpl.validateCategory
 * rejects a non-EXPENSE categoryId with 400, so the hook fetches with
 * ?type=EXPENSE and an INCOME category can never reach the dropdown.
 */
interface BudgetFormModalProps {
  title: string;
  submitLabel: string;
  initialValues: BudgetRequest;
  categories: CategoryOption[];
  onClose: () => void;
  onSubmit: (values: BudgetRequest) => Promise<void>;
}

function inputClasses(hasError: boolean) {
  return `w-full rounded-xl border bg-white/70 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-700/30 focus:bg-white ${
    hasError ? 'border-red-400' : 'border-sky-200'
  }`;
}

const labelClasses = 'mb-1.5 block text-xs font-semibold text-navy-700/70';

export function BudgetFormModal({
  title,
  submitLabel,
  initialValues,
  categories,
  onClose,
  onSubmit,
}: BudgetFormModalProps) {
  const [values, setValues] = useState<BudgetRequest>(initialValues);
  const [errors, setErrors] = useState<BudgetFieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function update<K extends keyof BudgetRequest>(key: K, value: BudgetRequest[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const validationErrors = validateBudgetForm(values);
    setErrors(validationErrors);
    if (hasBudgetErrors(validationErrors)) return;

    setSubmitting(true);
    try {
      await onSubmit(values);
    } catch (err) {
      // The readable message ("categoryId 4 is not an EXPENSE category") is in the
      // response body, not on the AxiosError. This line outlives the toast.
      setSubmitError(
        extractErrorMessage(err, 'Something went wrong. Please try again.')
      );
    } finally {
      setSubmitting(false);
    }
  }

  const selectedCategory = categories.find((c) => c.id === values.categoryId);

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
          <div>
            <label htmlFor="budget-amount" className={labelClasses}>
              Budget amount (₹) *
            </label>
            <input
              id="budget-amount"
              type="number"
              min="0.01"
              step="0.01"
              value={values.amount ?? ''}
              onChange={(e) =>
                update('amount', e.target.value === '' ? null : Number(e.target.value))
              }
              placeholder="10000"
              className={inputClasses(!!errors.amount)}
              aria-invalid={!!errors.amount}
            />
            {errors.amount && (
              <p className="mt-1 text-xs text-red-500">{errors.amount}</p>
            )}
          </div>

          <div>
            <label htmlFor="budget-period" className={labelClasses}>
              Period *
            </label>
            <select
              id="budget-period"
              value={values.period}
              onChange={(e) =>
                update('period', e.target.value as BudgetRequest['period'])
              }
              className={inputClasses(!!errors.period)}
            >
              {BUDGET_PERIODS.map((period) => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </select>
            {/* computeEndDate() in BudgetServiceImpl, spelled out. */}
            <p className="mt-1 text-xs text-navy-700/45">
              {values.period === 'DAILY' && 'Runs for the start date only.'}
              {values.period === 'WEEKLY' && 'Runs for 7 days from the start date.'}
              {values.period === 'MONTHLY' &&
                'Runs to the day before the same date next month.'}
            </p>
          </div>

          <div>
            <label htmlFor="budget-start-date" className={labelClasses}>
              Start date *
            </label>
            {/* No `max` — see the note at the top of this file. */}
            <input
              id="budget-start-date"
              type="date"
              value={values.startDate}
              onChange={(e) => update('startDate', e.target.value)}
              className={inputClasses(!!errors.startDate)}
              aria-invalid={!!errors.startDate}
            />
            {errors.startDate ? (
              <p className="mt-1 text-xs text-red-500">{errors.startDate}</p>
            ) : (
              <p className="mt-1 text-xs text-navy-700/45">
                A future date is allowed — plan next month now.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="budget-threshold" className={labelClasses}>
              Alert threshold (%) *
            </label>
            <input
              id="budget-threshold"
              type="number"
              min="1"
              max="100"
              step="1"
              value={values.alertThresholdPercent}
              onChange={(e) =>
                update(
                  'alertThresholdPercent',
                  e.target.value === '' ? NaN : Number(e.target.value)
                )
              }
              className={inputClasses(!!errors.alertThresholdPercent)}
              aria-invalid={!!errors.alertThresholdPercent}
            />
            {errors.alertThresholdPercent ? (
              <p className="mt-1 text-xs text-red-500">
                {errors.alertThresholdPercent}
              </p>
            ) : (
              <p className="mt-1 text-xs text-navy-700/45">
                1–100. The backend defaults to 80.
              </p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="budget-category" className={labelClasses}>
              Category
            </label>
            {/*
              Optional on the DTO. "Overall" (categoryId = null) makes the backend
              sum EVERY expense in the date range; picking a category makes it sum
              only the matching ones.
            */}
            <select
              id="budget-category"
              value={values.categoryId ?? ''}
              onChange={(e) =>
                update('categoryId', e.target.value === '' ? null : Number(e.target.value))
              }
              className={inputClasses(false)}
            >
              <option value="">Overall — all expenses</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            {categories.length === 0 && (
              <p className="mt-1 text-xs text-navy-700/45">
                No expense categories found, so only an overall budget is
                available. Add one under Category Management.
              </p>
            )}

            {/*
              The single most surprising thing about this module, so it is stated
              on the form rather than left to be discovered: BudgetServiceImpl
              resolves categoryId to the category's NAME and sums expenses whose
              own free-text `category` string equals it, case-insensitively.
              An expense typed as "Grocery" does not count towards "Groceries".
            */}
            {selectedCategory && (
              <p className="mt-2 flex items-start gap-2 rounded-xl bg-sky-50 px-3 py-2 text-xs text-navy-700/60">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-blue" />
                <span>
                  Spend is matched by name: only expenses whose category reads
                  exactly &ldquo;{selectedCategory.name}&rdquo; count towards this
                  budget.
                </span>
              </p>
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
