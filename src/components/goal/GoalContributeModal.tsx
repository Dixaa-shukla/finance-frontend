import { useState } from 'react';
import { AlertTriangle, HandCoins, X } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { extractErrorMessage } from '@/api/axiosClient';
import { validateContribution } from '@/utils/goalValidation';
import { formatINR } from '@/utils/format';
import type { GoalResponse } from '@/types/goal';

/**
 * POST /api/v1/goals/{id}/contribute.
 *
 * Its own dialog rather than a field on the edit form, because it is its own
 * endpoint with its own one-field DTO (GoalContributionRequest) — and because
 * PUT /goals/{id} cannot touch currentAmount at all.
 *
 * ⚠️ ADDITIVE AND IRREVERSIBLE, WHICH IS WHY THE WARNING IS NOT OPTIONAL.
 * contributeToGoal does currentAmount.add(amount), the amount is
 * @DecimalMin("0.01") so a negative correction is a 400, and no route subtracts
 * or deletes a contribution. A mistyped ₹50,000 can only be undone by deleting
 * the whole goal and starting again.
 *
 * ⚠️ IT ALSO DOES NOT CREATE AN EXPENSE OR A TRANSACTION. Nothing in
 * GoalServiceImpl touches the expense or transaction tables — from the entity's
 * comment, currentAmount "is never auto-derived from Expense/Income" — so this
 * records progress against the goal only.
 */
interface GoalContributeModalProps {
  goal: GoalResponse;
  onClose: () => void;
  onSubmit: (amount: number) => Promise<void>;
}

export function GoalContributeModal({
  goal,
  onClose,
  onSubmit,
}: GoalContributeModalProps) {
  const [amount, setAmount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const validationError = validateContribution(amount);
    setError(validationError);
    if (validationError || amount === null) return;

    setSubmitting(true);
    try {
      await onSubmit(amount);
    } catch (err) {
      setSubmitError(
        extractErrorMessage(err, 'Something went wrong. Please try again.')
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Previewed locally purely as feedback while typing; the figure that gets
  // stored is whatever the server returns on the next read.
  const projected = amount !== null && !Number.isNaN(amount)
    ? goal.currentAmount + amount
    : goal.currentAmount;
  const willComplete = projected >= goal.targetAmount;

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
        className="glass-card relative z-10 my-auto w-full max-w-md p-6 sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-navy-900">Add Contribution</h2>
            <p className="mt-0.5 truncate text-xs text-navy-700/55">
              {goal.title}
            </p>
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

        <dl className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-sky-50 px-3.5 py-2.5">
            <dt className="text-[11px] font-semibold text-navy-700/55">
              Saved so far
            </dt>
            <dd className="mt-0.5 truncate text-sm font-bold text-navy-900">
              {formatINR(goal.currentAmount)}
            </dd>
          </div>
          <div className="rounded-xl bg-sky-50 px-3.5 py-2.5">
            <dt className="text-[11px] font-semibold text-navy-700/55">
              Still to go
            </dt>
            <dd className="mt-0.5 truncate text-sm font-bold text-navy-900">
              {formatINR(Math.max(goal.remainingAmount, 0))}
            </dd>
          </div>
        </dl>

        <div className="mt-5">
          <label
            htmlFor="goal-contribution"
            className="mb-1.5 block text-xs font-semibold text-navy-700/70"
          >
            Contribution amount (₹) *
          </label>
          <input
            id="goal-contribution"
            type="number"
            min="0.01"
            step="0.01"
            value={amount ?? ''}
            onChange={(e) =>
              setAmount(e.target.value === '' ? null : Number(e.target.value))
            }
            placeholder="5000"
            autoFocus
            className={`w-full rounded-xl border bg-white/70 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-700/30 focus:bg-white ${
              error ? 'border-red-400' : 'border-sky-200'
            }`}
            aria-invalid={!!error}
          />
          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>

        {amount !== null && !Number.isNaN(amount) && amount > 0 && (
          <p className="mt-3 rounded-xl bg-lavender-100/60 px-3.5 py-2.5 text-xs text-navy-700/65">
            Saved will become{' '}
            <strong className="font-bold text-navy-900">
              {formatINR(projected)}
            </strong>
            {willComplete && ' — that completes this goal.'}
          </p>
        )}

        {/* Not a nicety: nothing in the API can reverse this. */}
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3.5 py-2.5 text-xs text-amber-700">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Contributions only ever add. There is no way to reverse or reduce one
            afterwards, so check the amount before saving.
          </span>
        </p>

        {submitError && (
          <p className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">
            {submitError}
          </p>
        )}

        <div className="mt-6 flex items-center gap-3">
          <Button
            type="submit"
            loading={submitting}
            icon={<HandCoins className="h-4 w-4" />}
          >
            Add Contribution
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
