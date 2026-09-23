import {
  AlertTriangle,
  CalendarDays,
  Layers,
  Pencil,
  Tag,
  Trash2,
} from 'lucide-react';
import { formatDate, formatINR } from '@/utils/format';
import type { BudgetResponse } from '@/types/budget';

/**
 * One card per budget.
 *
 * ⚠️ NOTHING HERE IS RECALCULATED. spentAmount, remainingAmount, percentUsed,
 * endDate and alertTriggered all arrive from BudgetServiceImpl.toResponse(),
 * which recomputes them from live Expense rows on every read. The card only
 * formats them.
 *
 * ⚠️ THE BAR IS CLAMPED AT 100% BUT THE PRINTED PERCENTAGE IS NOT. percentUsed
 * is a raw `double` — spending ₹6,000 against a ₹4,000 budget sends 150.0 — so a
 * bar of width 150% would break the layout while hiding the overspend. The bar
 * fills and the number keeps counting.
 *
 * ⚠️ EDIT AND DELETE ARE ALWAYS OFFERED, UNLIKE THE CATEGORY GRID. There is no
 * @PreAuthorize on BudgetController and no default/shared concept on a budget:
 * every row belongs to the signed-in user, so every row is editable.
 */
interface BudgetGridProps {
  budgets: BudgetResponse[];
  busy: boolean;
  onEdit: (budget: BudgetResponse) => void;
  onDelete: (budget: BudgetResponse) => void;
}

/** Bar and figure colour, driven by the budget's own threshold. */
function toneFor(percentUsed: number, threshold: number) {
  if (percentUsed >= 100) {
    return { bar: 'from-red-400 to-red-500', text: 'text-red-600' };
  }
  if (percentUsed >= threshold) {
    return { bar: 'from-amber-400 to-orange-500', text: 'text-amber-600' };
  }
  return { bar: 'from-brand-green to-brand-cyan', text: 'text-brand-green' };
}

const PERIOD_LABELS: Record<BudgetResponse['period'], string> = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
};

export function BudgetGrid({ budgets, busy, onEdit, onDelete }: BudgetGridProps) {
  // "Nothing matched the tab or the toggle" is handled here rather than on the
  // page, so the toolbar stays on screen and the filter can be cleared.
  if (budgets.length === 0) {
    return (
      <div className="glass-card p-10 text-center">
        <p className="text-sm font-semibold text-navy-900">
          No budgets match this filter
        </p>
        <p className="mt-1 text-xs text-navy-700/50">
          Switch back to All, or turn the alerts-only toggle off.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {budgets.map((budget) => {
        const tone = toneFor(budget.percentUsed, budget.alertThresholdPercent);
        const barWidth = Math.min(budget.percentUsed, 100);
        const overspent = budget.remainingAmount < 0;

        return (
          <div key={budget.id} className="glass-card flex flex-col p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-soft ${
                    budget.categoryId === null
                      ? 'from-brand-blue to-brand-purple'
                      : 'from-brand-purple to-brand-sky'
                  }`}
                >
                  {budget.categoryId === null ? (
                    <Layers className="h-5 w-5" />
                  ) : (
                    <Tag className="h-5 w-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-navy-900">
                    {budget.categoryName ?? 'Overall budget'}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-navy-700/50">
                    <CalendarDays className="h-3 w-3 shrink-0" />
                    <span className="truncate">
                      {formatDate(budget.startDate)} — {formatDate(budget.endDate)}
                    </span>
                  </p>
                </div>
              </div>

              <span className="shrink-0 rounded-pill bg-lavender-100 px-2.5 py-1 text-[11px] font-bold text-brand-purple">
                {PERIOD_LABELS[budget.period]}
              </span>
            </div>

            <div className="mt-4">
              <div className="flex items-end justify-between gap-2">
                <p className="text-xl font-extrabold tracking-tight text-navy-900">
                  {formatINR(budget.spentAmount)}
                  <span className="ml-1 text-xs font-semibold text-navy-700/45">
                    of {formatINR(budget.amount)}
                  </span>
                </p>
                <p className={`shrink-0 text-sm font-bold ${tone.text}`}>
                  {Math.round(budget.percentUsed)}%
                </p>
              </div>

              <div
                className="mt-2 h-2 w-full overflow-hidden rounded-pill bg-sky-100"
                role="progressbar"
                aria-valuenow={Math.round(budget.percentUsed)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${budget.categoryName ?? 'Overall budget'} used`}
              >
                <div
                  className={`h-full rounded-pill bg-gradient-to-r ${tone.bar}`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>

              <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                <span className="text-navy-700/50">
                  Alert at {budget.alertThresholdPercent}%
                </span>
                <span
                  className={
                    overspent ? 'font-bold text-red-600' : 'font-semibold text-navy-700/60'
                  }
                >
                  {overspent ? 'Over by ' : 'Left '}
                  {formatINR(Math.abs(budget.remainingAmount))}
                </span>
              </div>
            </div>

            {budget.alertTriggered && (
              <p className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  Past the {budget.alertThresholdPercent}% alert threshold.
                </span>
              </p>
            )}

            {/*
              A per-category budget reading ₹0 is usually a label mismatch, not a
              quiet month: BudgetServiceImpl resolves categoryId to its NAME and
              sums expenses whose free-text `category` equals that name. Saying so
              here saves the user hunting for a bug that is really a typo.
            */}
            {budget.categoryId !== null && budget.spentAmount === 0 && (
              <p className="mt-3 rounded-xl bg-sky-50 px-3 py-2 text-xs text-navy-700/60">
                No expenses labelled &ldquo;{budget.categoryName}&rdquo; in this
                range yet. Spend is matched by that exact name.
              </p>
            )}

            <div className="mt-4 flex items-center justify-end gap-2 border-t border-sky-100 pt-3">
              <button
                type="button"
                onClick={() => onEdit(budget)}
                disabled={busy}
                aria-label={`Edit ${budget.categoryName ?? 'overall'} budget`}
                className="inline-flex items-center gap-1.5 rounded-pill border border-sky-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-navy-700 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(budget)}
                disabled={busy}
                aria-label={`Delete ${budget.categoryName ?? 'overall'} budget`}
                className="inline-flex items-center gap-1.5 rounded-pill border border-red-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
