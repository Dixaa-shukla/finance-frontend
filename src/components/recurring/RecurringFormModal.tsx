import { useState } from 'react';
import { CalendarClock, X } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { extractErrorMessage } from '@/api/axiosClient';
import {
  describeBackfill,
  hasRecurringErrors,
  validateRecurringForm,
  type RecurringFieldErrors,
} from '@/utils/recurringValidation';
import { CATEGORY_SUGGESTIONS, PAYMENT_METHODS } from '@/types/expense';
import { INCOME_SOURCES } from '@/types/income';
import {
  RECURRING_FREQUENCIES,
  type RecurringTransactionRequest,
} from '@/types/recurring';

/**
 * Add / edit dialog for POST /recurring-transactions and PUT /{id}.
 *
 * Both routes take the same RecurringTransactionRequest, so one form serves
 * both — the page picks the service call.
 *
 * ⚠️ THE TYPE SELECT SWAPS WHICH FIELDS EXIST, BECAUSE THE SERVER CHECKS THEM
 * PER TYPE. validateTypeSpecificFields() requires category for EXPENSE and
 * incomeSource for INCOME, and throws BadRequestException — a bare 400 with no
 * fieldErrors map — so the form has to get this right before submitting.
 *
 * ⚠️ THERE IS NO nextDueDate FIELD AND NO ACTIVE TOGGLE. toEntity() writes
 * neither, so both would be silently ignored. nextDueDate is set to startDate
 * once, on create; pause/resume own the flag.
 *
 * ⚠️ IN EDIT MODE, CHANGING startDate DOES NOT MOVE THE SCHEDULE.
 * updateRecurringTransaction deliberately leaves nextDueDate alone ("editing
 * amount/title shouldn't restart the schedule"), so the stored startDate and the
 * live nextDueDate can disagree after an edit. The form says so rather than
 * hiding the field.
 */
interface RecurringFormModalProps {
  title: string;
  submitLabel: string;
  /** True for PUT. Only changes the wording, never the payload. */
  editing: boolean;
  initialValues: RecurringTransactionRequest;
  onClose: () => void;
  onSubmit: (values: RecurringTransactionRequest) => Promise<void>;
}

function inputClasses(hasError: boolean) {
  return `w-full rounded-xl border bg-white/70 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-700/30 focus:bg-white ${
    hasError ? 'border-red-400' : 'border-sky-200'
  }`;
}

const labelClasses = 'mb-1.5 block text-xs font-semibold text-navy-700/70';

export function RecurringFormModal({
  title,
  submitLabel,
  editing,
  initialValues,
  onClose,
  onSubmit,
}: RecurringFormModalProps) {
  const [values, setValues] = useState<RecurringTransactionRequest>(initialValues);
  const [errors, setErrors] = useState<RecurringFieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isIncome = values.type === 'INCOME';
  const backfill = describeBackfill(values);

  function update<K extends keyof RecurringTransactionRequest>(
    key: K,
    value: RecurringTransactionRequest[K]
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  /*
   * Switching type clears the other type's field in the same update. Leaving a
   * stale category on an income rule would post a value the server stores but
   * never reads, and the card would then show a category chip for a row whose
   * generated transactions are incomes.
   */
  function changeType(next: RecurringTransactionRequest['type']) {
    setValues((prev) => ({
      ...prev,
      type: next,
      category: next === 'EXPENSE' ? prev.category : null,
      incomeSource: next === 'INCOME' ? prev.incomeSource : null,
      paymentMethod: next === 'EXPENSE' ? prev.paymentMethod : null,
    }));
    setErrors({});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const validationErrors = validateRecurringForm(values);
    setErrors(validationErrors);
    if (hasRecurringErrors(validationErrors)) return;

    setSubmitting(true);
    try {
      // Trim what @NotBlank / @Size would otherwise store with padding, and send
      // null instead of "" for the optional strings so the row reads as "not
      // set". endDate is a real null when left empty — that is what "runs
      // indefinitely" means to the sweep.
      await onSubmit({
        ...values,
        title: values.title.trim(),
        category:
          values.type === 'EXPENSE' && values.category?.trim()
            ? values.category.trim()
            : null,
        endDate: values.endDate || null,
        notes: values.notes?.trim() ? values.notes.trim() : null,
      });
    } catch (err) {
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
          <div>
            <label htmlFor="recurring-type" className={labelClasses}>
              Type *
            </label>
            {/* The enum has exactly two values, and each one changes the form. */}
            <select
              id="recurring-type"
              value={values.type}
              onChange={(e) =>
                changeType(e.target.value as RecurringTransactionRequest['type'])
              }
              className={inputClasses(false)}
            >
              <option value="EXPENSE">Expense — money going out</option>
              <option value="INCOME">Income — money coming in</option>
            </select>
            <p className="mt-1 text-xs text-navy-700/45">
              Each occurrence becomes a real{' '}
              {isIncome ? 'income' : 'expense'} row.
            </p>
          </div>

          <div>
            <label htmlFor="recurring-frequency" className={labelClasses}>
              Frequency *
            </label>
            <select
              id="recurring-frequency"
              value={values.frequency}
              onChange={(e) =>
                update(
                  'frequency',
                  e.target.value as RecurringTransactionRequest['frequency']
                )
              }
              className={inputClasses(false)}
            >
              {RECURRING_FREQUENCIES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} — {option.every}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="recurring-title" className={labelClasses}>
              Title *
            </label>
            <input
              id="recurring-title"
              type="text"
              maxLength={100}
              value={values.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder={isIncome ? 'Monthly salary' : 'Netflix subscription'}
              className={inputClasses(!!errors.title)}
              aria-invalid={!!errors.title}
            />
            {errors.title ? (
              <p className="mt-1 text-xs text-red-500">{errors.title}</p>
            ) : (
              /*
                Worth saying because the title is not just a label here:
                generateTransactionFor passes it straight through as the
                merchant / source description on every generated row.
              */
              <p className="mt-1 text-xs text-navy-700/45">
                Also used as the {isIncome ? 'description' : 'merchant'} on every
                row this rule creates.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="recurring-amount" className={labelClasses}>
              Amount per occurrence (₹) *
            </label>
            <input
              id="recurring-amount"
              type="number"
              min="0.01"
              step="0.01"
              value={values.amount ?? ''}
              onChange={(e) =>
                update('amount', e.target.value === '' ? null : Number(e.target.value))
              }
              placeholder="649"
              className={inputClasses(!!errors.amount)}
              aria-invalid={!!errors.amount}
            />
            {errors.amount && (
              <p className="mt-1 text-xs text-red-500">{errors.amount}</p>
            )}
          </div>

          {/*
            Exactly one of these two is rendered, matching
            validateTypeSpecificFields(). Category is a free-text field with
            suggestions, like the expense form — the column is a plain
            @Size(max = 50) string, not a foreign key.
          */}
          {isIncome ? (
            <div>
              <label htmlFor="recurring-income-source" className={labelClasses}>
                Income source *
              </label>
              <select
                id="recurring-income-source"
                value={values.incomeSource ?? ''}
                onChange={(e) =>
                  update(
                    'incomeSource',
                    (e.target.value || null) as RecurringTransactionRequest['incomeSource']
                  )
                }
                className={inputClasses(!!errors.incomeSource)}
                aria-invalid={!!errors.incomeSource}
              >
                <option value="">Select a source</option>
                {INCOME_SOURCES.map((source) => (
                  <option key={source.value} value={source.value}>
                    {source.label}
                  </option>
                ))}
              </select>
              {errors.incomeSource && (
                <p className="mt-1 text-xs text-red-500">{errors.incomeSource}</p>
              )}
            </div>
          ) : (
            <div>
              <label htmlFor="recurring-category" className={labelClasses}>
                Category *
              </label>
              <input
                id="recurring-category"
                type="text"
                list="recurring-category-suggestions"
                maxLength={50}
                value={values.category ?? ''}
                onChange={(e) => update('category', e.target.value)}
                placeholder="e.g. Entertainment"
                className={inputClasses(!!errors.category)}
                aria-invalid={!!errors.category}
              />
              <datalist id="recurring-category-suggestions">
                {CATEGORY_SUGGESTIONS.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
              {errors.category && (
                <p className="mt-1 text-xs text-red-500">{errors.category}</p>
              )}
            </div>
          )}

          {/*
            Expense-only and genuinely optional — the DTO comment says so, and
            generateTransactionFor substitutes PaymentMethod.OTHER when it is
            null, which is what the blank option promises.
          */}
          {!isIncome && (
            <div className="sm:col-span-2">
              <label htmlFor="recurring-payment-method" className={labelClasses}>
                Payment method
              </label>
              <select
                id="recurring-payment-method"
                value={values.paymentMethod ?? ''}
                onChange={(e) =>
                  update(
                    'paymentMethod',
                    (e.target.value || null) as RecurringTransactionRequest['paymentMethod']
                  )
                }
                className={inputClasses(false)}
              >
                <option value="">Not specified — saved as Other</option>
                {PAYMENT_METHODS.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="recurring-start-date" className={labelClasses}>
              Start date *
            </label>
            {/*
              No min and no max, unlike the goal and expense forms. startDate
              carries no date annotation at all, so a future start ("begins next
              month") and a back-dated start are both legal. A past date is
              warned about below instead of blocked.
            */}
            <input
              id="recurring-start-date"
              type="date"
              value={values.startDate}
              onChange={(e) => update('startDate', e.target.value)}
              className={inputClasses(!!errors.startDate)}
              aria-invalid={!!errors.startDate}
            />
            {errors.startDate && (
              <p className="mt-1 text-xs text-red-500">{errors.startDate}</p>
            )}
          </div>

          <div>
            <label htmlFor="recurring-end-date" className={labelClasses}>
              End date
            </label>
            <input
              id="recurring-end-date"
              type="date"
              min={values.startDate || undefined}
              value={values.endDate ?? ''}
              onChange={(e) => update('endDate', e.target.value || null)}
              className={inputClasses(!!errors.endDate)}
              aria-invalid={!!errors.endDate}
            />
            {errors.endDate ? (
              <p className="mt-1 text-xs text-red-500">{errors.endDate}</p>
            ) : (
              <p className="mt-1 text-xs text-navy-700/45">
                Optional. Leave blank to run indefinitely.
              </p>
            )}
          </div>

          {/*
            The single most consequential thing on this form. The backend sets
            nextDueDate = startDate on create and the sweep then loops
            `while (nextDueDate <= today)`, so a back-dated rule does not produce
            one row on its first run — it produces one per elapsed period.
          */}
          {backfill && (
            <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-3.5 py-2.5 text-xs text-amber-700 sm:col-span-2">
              <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                This start date is in the past, so the next run will catch up:{' '}
                <strong className="font-semibold">{backfill}</strong>. Pick today
                or later if you only want it to start now.
              </span>
            </p>
          )}

          <div className="sm:col-span-2">
            <label htmlFor="recurring-notes" className={labelClasses}>
              Notes
            </label>
            <textarea
              id="recurring-notes"
              rows={3}
              maxLength={500}
              value={values.notes ?? ''}
              onChange={(e) => update('notes', e.target.value || null)}
              placeholder="Copied onto every row this rule creates"
              className={inputClasses(!!errors.notes)}
              aria-invalid={!!errors.notes}
            />
            {errors.notes ? (
              <p className="mt-1 text-xs text-red-500">{errors.notes}</p>
            ) : (
              <p className="mt-1 text-xs text-navy-700/45">
                Optional. {(values.notes ?? '').length}/500 — left blank, each row
                is labelled &ldquo;Auto-generated from recurring rule&rdquo;.
              </p>
            )}
          </div>

          {/*
            Edit-only, and not a nicety: after a PUT the stored startDate can
            disagree with the live nextDueDate, and there is no field here that
            can reconcile them. Saying so is cheaper than a support question.
          */}
          {editing ? (
            <p className="rounded-xl bg-sky-50 px-3.5 py-2.5 text-xs text-navy-700/60 sm:col-span-2">
              Editing a rule never moves its next due date — the schedule keeps
              running from where it already is, even if you change the start date.
              Rows this rule has already created are not touched either.
            </p>
          ) : (
            <p className="rounded-xl bg-sky-50 px-3.5 py-2.5 text-xs text-navy-700/60 sm:col-span-2">
              The rule starts out active and its first occurrence is due on the
              start date. Nothing is created until the nightly run reaches it.
            </p>
          )}





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
