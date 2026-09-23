import { useState } from 'react';
import { AlertTriangle, X, Zap } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { extractErrorMessage } from '@/api/axiosClient';
import { formatDate, todayISO } from '@/utils/format';
import { countOccurrencesThrough } from '@/utils/recurringSchedule';
import type { RecurringTransactionResponse } from '@/types/recurring';

/**
 * Confirmation for POST /recurring-transactions/process-due.
 *
 * Its own component rather than the shared ConfirmDialog because this action
 * needs three separate warnings that a one-line confirm cannot carry.
 *
 * ⚠️ THE ROUTE IS SYSTEM-WIDE, NOT USER-SCOPED.
 * processDueRecurringTransactions() calls
 * findByIsActiveTrueAndNextDueDateLessThanEqual(today) with no userId filter, and
 * the path has no /user/{userId} segment so UserOwnershipInterceptor never runs.
 * Any signed-in account triggering this processes every due rule in the database,
 * and the returned transactionsGenerated is a system-wide total. Nothing here
 * calls that number "yours".
 *
 * ⚠️ IT WRITES REAL ROWS AND THERE IS NO BULK UNDO. Each occurrence becomes an
 * Expense or Income row through the normal create path; removing them means
 * deleting each one by hand in those modules.
 *
 * ⚠️ THE PER-RULE COUNTS BELOW ARE THIS BROWSER'S ESTIMATE. The server does not
 * offer a dry run, so countOccurrencesThrough re-walks the same loop locally.
 * They are shown to convey scale, and labelled as estimates.
 */
interface ProcessDueModalProps {
  /** Only this user's overdue rules — what they can actually reason about. */
  overdueRules: RecurringTransactionResponse[];
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function ProcessDueModal({
  overdueRules,
  onClose,
  onConfirm,
}: ProcessDueModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = todayISO();
  const estimates = overdueRules.map((rule) => ({
    rule,
    ...countOccurrencesThrough(
      rule.nextDueDate,
      today,
      rule.frequency,
      rule.endDate
    ),
  }));
  const totalRows = estimates.reduce((sum, item) => sum + item.count, 0);
  const anyCapped = estimates.some((item) => item.capped);

  async function handleConfirm() {
    setError(null);
    setSubmitting(true);
    try {
      await onConfirm();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not run the sweep.'));
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

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="process-due-title"
        className="glass-card relative z-10 my-auto w-full max-w-xl p-6 sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-blue to-brand-purple text-white shadow-soft">
              <Zap className="h-5 w-5" />
            </div>
            <h2
              id="process-due-title"
              className="text-lg font-bold text-navy-900"
            >
              Run the due sweep now?
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-navy-700/50 hover:bg-sky-100 hover:text-navy-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-5 text-sm text-navy-700">
          This is the same job the scheduler runs at 01:00 every night. It creates
          one real transaction for every occurrence each due rule has missed, then
          moves the rule forward.
        </p>

        <div className="mt-4 space-y-2 rounded-xl bg-sky-50/70 px-4 py-3">
          <p className="text-xs font-semibold text-navy-700/70">
            Your overdue rules — about {anyCapped ? `${totalRows}+` : totalRows}{' '}
            row{totalRows === 1 ? '' : 's'} in total
          </p>
          {estimates.map(({ rule, count, capped }) => (
            <p key={rule.id} className="flex items-baseline justify-between gap-3 text-xs">
              <span className="truncate font-medium text-navy-900">
                {rule.title}
              </span>
              <span className="shrink-0 text-navy-700/55">
                {capped ? `${count}+` : count}{' '}
                {rule.type === 'EXPENSE' ? 'expense' : 'income'}
                {count === 1 ? '' : 's'} · from {formatDate(rule.nextDueDate)}
              </span>
            </p>
          ))}
          <p className="pt-1 text-[11px] text-navy-700/45">
            Estimated in this browser — the server has no dry-run mode.
          </p>
        </div>

        {/*
          Both of these are properties of the endpoint, not of this screen, so
          they are stated plainly rather than softened.
        */}
        <div className="mt-4 space-y-2">
          <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-2.5 text-xs text-amber-700">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              The rows are permanent. They land in your Expense and Income lists
              like any other entry, and there is no bulk undo — each one has to be
              deleted individually.
            </span>
          </p>
          <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-2.5 text-xs text-amber-700">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              The sweep is not limited to your account. It processes every due
              rule in the system, so the count it reports back is a total for all
              users, not only yours.
            </span>
          </p>
        </div>

        {error && (
          <p className="mt-5 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mt-7 flex items-center gap-3">
          <Button type="button" loading={submitting} onClick={handleConfirm}>
            Run sweep now
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

      </div>
    </div>
  );
}
