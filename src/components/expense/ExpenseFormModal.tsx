import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { todayISO } from '@/utils/format';
import {
  hasExpenseErrors,
  validateExpenseForm,
  type ExpenseFieldErrors,
} from '@/utils/expenseValidation';
import {
  CATEGORY_SUGGESTIONS,
  PAYMENT_METHODS,
  type ExpenseRequest,
} from '@/types/expense';

/**
 * Add / edit dialog for POST /expenses and PUT /expenses/{id}.
 *
 * Every input maps to a field on ExpenseRequest, and the maxLength values are
 * the @Size limits from that DTO, so the browser stops the user before the
 * server has to reject them. Validation still runs server-side as well.
 */
interface ExpenseFormModalProps {
  title: string;
  submitLabel: string;
  initialValues: ExpenseRequest;
  onClose: () => void;
  onSubmit: (values: ExpenseRequest) => Promise<void>;
}

function inputClasses(hasError: boolean) {
  return `w-full rounded-xl border bg-white/70 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-700/30 focus:bg-white ${
    hasError ? 'border-red-400' : 'border-sky-200'
  }`;
}

export function ExpenseFormModal({
  title,
  submitLabel,
  initialValues,
  onClose,
  onSubmit,
}: ExpenseFormModalProps) {
  const [values, setValues] = useState<ExpenseRequest>(initialValues);
  // Tags are one comma-separated text field here and a List<String> on the
  // wire, so the raw text is kept separately while the user is typing.
  const [tagText, setTagText] = useState((initialValues.tags ?? []).join(', '));
  const [errors, setErrors] = useState<ExpenseFieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function update<K extends keyof ExpenseRequest>(
    key: K,
    value: ExpenseRequest[K]
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const tags = tagText
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag !== '');

    const payload: ExpenseRequest = { ...values, tags };

    const validationErrors = validateExpenseForm(payload);
    setErrors(validationErrors);
    if (hasExpenseErrors(validationErrors)) return;

    setSubmitting(true);
    try {
      await onSubmit(payload);
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
              htmlFor="amount"
              className="mb-1.5 block text-xs font-semibold text-navy-700/70"
            >
              Amount (₹) *
            </label>
            <input
              id="amount"
              type="number"
              min="0.01"
              step="0.01"
              value={values.amount ?? ''}
              onChange={(e) =>
                update('amount', e.target.value === '' ? null : Number(e.target.value))
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
              htmlFor="expenseDate"
              className="mb-1.5 block text-xs font-semibold text-navy-700/70"
            >
              Date *
            </label>
            <input
              id="expenseDate"
              type="date"
              max={todayISO()}
              value={values.expenseDate}
              onChange={(e) => update('expenseDate', e.target.value)}
              className={inputClasses(!!errors.expenseDate)}
              aria-invalid={!!errors.expenseDate}
            />
            {errors.expenseDate && (
              <p className="mt-1 text-xs text-red-500">{errors.expenseDate}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="category"
              className="mb-1.5 block text-xs font-semibold text-navy-700/70"
            >
              Category *
            </label>
            <input
              id="category"
              type="text"
              list="expense-categories-form"
              maxLength={50}
              value={values.category}
              onChange={(e) => update('category', e.target.value)}
              placeholder="e.g. Food & Dining"
              className={inputClasses(!!errors.category)}
              aria-invalid={!!errors.category}
            />
            {/* Suggestions only — the backend accepts any category string. */}
            <datalist id="expense-categories-form">
              {CATEGORY_SUGGESTIONS.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
            {errors.category && (
              <p className="mt-1 text-xs text-red-500">{errors.category}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="paymentMethod"
              className="mb-1.5 block text-xs font-semibold text-navy-700/70"
            >
              Payment Method *
            </label>
            <select
              id="paymentMethod"
              value={values.paymentMethod}
              onChange={(e) =>
                update('paymentMethod', e.target.value as ExpenseRequest['paymentMethod'])
              }
              className={inputClasses(!!errors.paymentMethod)}
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="merchant"
              className="mb-1.5 block text-xs font-semibold text-navy-700/70"
            >
              Merchant
            </label>
            <input
              id="merchant"
              type="text"
              maxLength={150}
              value={values.merchant ?? ''}
              onChange={(e) => update('merchant', e.target.value || null)}
              placeholder="e.g. Domino's Pizza"
              className={inputClasses(!!errors.merchant)}
              aria-invalid={!!errors.merchant}
            />
            {errors.merchant && (
              <p className="mt-1 text-xs text-red-500">{errors.merchant}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="location"
              className="mb-1.5 block text-xs font-semibold text-navy-700/70"
            >
              Location
            </label>
            <input
              id="location"
              type="text"
              maxLength={150}
              value={values.location ?? ''}
              onChange={(e) => update('location', e.target.value || null)}
              placeholder="e.g. Pune"
              className={inputClasses(!!errors.location)}
              aria-invalid={!!errors.location}
            />
            {errors.location && (
              <p className="mt-1 text-xs text-red-500">{errors.location}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="tags"
              className="mb-1.5 block text-xs font-semibold text-navy-700/70"
            >
              Tags
            </label>
            <input
              id="tags"
              type="text"
              value={tagText}
              onChange={(e) => setTagText(e.target.value)}
              placeholder="Comma separated, e.g. recurring, office"
              className={inputClasses(!!errors.tags)}
              aria-invalid={!!errors.tags}
            />
            {errors.tags && (
              <p className="mt-1 text-xs text-red-500">{errors.tags}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="receiptUrl"
              className="mb-1.5 block text-xs font-semibold text-navy-700/70"
            >
              Receipt URL
            </label>
            <input
              id="receiptUrl"
              type="url"
              maxLength={500}
              value={values.receiptUrl ?? ''}
              onChange={(e) => update('receiptUrl', e.target.value || null)}
              placeholder="Link to an uploaded receipt (optional)"
              className={inputClasses(false)}
            />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="notes"
              className="mb-1.5 block text-xs font-semibold text-navy-700/70"
            >
              Notes
            </label>
            <textarea
              id="notes"
              rows={3}
              maxLength={500}
              value={values.notes ?? ''}
              onChange={(e) => update('notes', e.target.value || null)}
              placeholder="Anything worth remembering about this expense"
              className={inputClasses(!!errors.notes)}
            />
            {errors.notes && (
              <p className="mt-1 text-xs text-red-500">{errors.notes}</p>
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
