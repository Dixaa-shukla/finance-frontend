import {
  CalendarClock,
  HandCoins,
  Pencil,
  Sparkles,
  Target,
  TimerOff,
  Trash2,
  Trophy,
} from 'lucide-react';
import { formatDate, formatINR } from '@/utils/format';
import { GOAL_STATUS_LABELS, type GoalResponse, type GoalStatus } from '@/types/goal';

/**
 * One card per goal.
 *
 * ⚠️ NOTHING HERE IS RECALCULATED. remainingAmount, progressPercent,
 * daysRemaining, status and suggestedMonthlySaving all arrive from
 * GoalServiceImpl.toResponse(), recomputed against today's date on every read.
 * The card only formats them.
 *
 * ⚠️ THE BAR IS CLAMPED AT 100% BUT THE PRINTED PERCENTAGE IS NOT.
 * progressPercent is a raw `double` — contributing ₹6,000 to a ₹4,000 goal sends
 * 150.0 — so a bar of that width would break the layout while hiding the
 * overfunding. The bar fills and the number keeps counting.
 *
 * ⚠️ daysRemaining IS NEGATIVE ONCE THE TARGET DATE HAS PASSED, straight from
 * ChronoUnit.DAYS.between(today, targetDate). It is phrased as "N days overdue"
 * rather than printed raw.
 */
interface GoalGridProps {
  goals: GoalResponse[];
  busy: boolean;
  onContribute: (goal: GoalResponse) => void;
  onEdit: (goal: GoalResponse) => void;
  onDelete: (goal: GoalResponse) => void;
}

const STATUS_STYLES: Record<GoalStatus, { chip: string; bar: string; text: string }> = {
  IN_PROGRESS: {
    chip: 'bg-sky-100 text-brand-blue',
    bar: 'from-brand-blue to-brand-purple',
    text: 'text-brand-blue',
  },
  COMPLETED: {
    chip: 'bg-emerald-50 text-brand-green',
    bar: 'from-brand-green to-brand-cyan',
    text: 'text-brand-green',
  },
  EXPIRED: {
    chip: 'bg-red-50 text-red-600',
    bar: 'from-red-400 to-red-500',
    text: 'text-red-600',
  },
};

const STATUS_ICONS: Record<GoalStatus, typeof Target> = {
  IN_PROGRESS: Target,
  COMPLETED: Trophy,
  EXPIRED: TimerOff,
};

/** Turns the signed daysRemaining into something readable. */
function deadlineText(goal: GoalResponse): string {
  if (goal.status === 'COMPLETED') return `Reached · due ${formatDate(goal.targetDate)}`;
  if (goal.daysRemaining < 0) {
    const overdue = Math.abs(goal.daysRemaining);
    return `${overdue} day${overdue === 1 ? '' : 's'} overdue`;
  }
  if (goal.daysRemaining === 0) return 'Due today';
  return `${goal.daysRemaining} day${goal.daysRemaining === 1 ? '' : 's'} left`;
}

export function GoalGrid({
  goals,
  busy,
  onContribute,
  onEdit,
  onDelete,
}: GoalGridProps) {
  // "Nothing matched the tab or the search" is handled here rather than on the
  // page, so the toolbar stays on screen and the filter can be cleared.
  if (goals.length === 0) {
    return (
      <div className="glass-card p-10 text-center">
        <p className="text-sm font-semibold text-navy-900">
          No goals match this filter
        </p>
        <p className="mt-1 text-xs text-navy-700/50">
          Try another status tab, or clear the search box.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {goals.map((goal) => {
        const style = STATUS_STYLES[goal.status];
        const StatusIcon = STATUS_ICONS[goal.status];
        const barWidth = Math.min(goal.progressPercent, 100);
        const overfunded = goal.remainingAmount < 0;

        return (
          <div key={goal.id} className="glass-card flex flex-col p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${style.bar} text-white shadow-soft`}
                >
                  <StatusIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-navy-900">
                    {goal.title}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-navy-700/50">
                    <CalendarClock className="h-3 w-3 shrink-0" />
                    <span className="truncate">{deadlineText(goal)}</span>
                  </p>
                </div>
              </div>

              <span
                className={`shrink-0 rounded-pill px-2.5 py-1 text-[11px] font-bold ${style.chip}`}
              >
                {GOAL_STATUS_LABELS[goal.status]}
              </span>
            </div>

            {/* Optional on the DTO, so it is only given room when it is there. */}
            {goal.description && (
              <p className="mt-3 line-clamp-2 text-xs text-navy-700/55">
                {goal.description}
              </p>
            )}

            <div className="mt-4">
              <div className="flex items-end justify-between gap-2">
                <p className="text-xl font-extrabold tracking-tight text-navy-900">
                  {formatINR(goal.currentAmount)}
                  <span className="ml-1 text-xs font-semibold text-navy-700/45">
                    of {formatINR(goal.targetAmount)}
                  </span>
                </p>
                <p className={`shrink-0 text-sm font-bold ${style.text}`}>
                  {Math.round(goal.progressPercent)}%
                </p>
              </div>

              <div
                className="mt-2 h-2 w-full overflow-hidden rounded-pill bg-sky-100"
                role="progressbar"
                aria-valuenow={Math.round(goal.progressPercent)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${goal.title} progress`}
              >
                <div
                  className={`h-full rounded-pill bg-gradient-to-r ${style.bar}`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>

              <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                <span className="text-navy-700/50">
                  Target {formatDate(goal.targetDate)}
                </span>
                <span
                  className={
                    overfunded
                      ? 'font-bold text-brand-green'
                      : 'font-semibold text-navy-700/60'
                  }
                >
                  {overfunded
                    ? `${formatINR(Math.abs(goal.remainingAmount))} over`
                    : `${formatINR(goal.remainingAmount)} to go`}
                </span>
              </div>
            </div>

            {/*
              suggestedMonthlySaving is null unless the goal is IN_PROGRESS with
              something still to save, so a `!= null` check is the whole gate —
              no need to re-test the status here.
            */}
            {goal.suggestedMonthlySaving !== null && (
              <p className="mt-3 flex items-start gap-2 rounded-xl bg-lavender-100/60 px-3 py-2 text-xs text-navy-700/65">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-purple" />
                <span>
                  Save{' '}
                  <strong className="font-bold text-navy-900">
                    {formatINR(goal.suggestedMonthlySaving)}
                  </strong>{' '}
                  a month to reach this on time.
                </span>
              </p>
            )}

            {goal.status === 'EXPIRED' && (
              <p className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
                <TimerOff className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  The target date passed with {formatINR(goal.remainingAmount)}{' '}
                  still to save. Edit it to push the date out.
                </span>
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-sky-100 pt-3">
              {/*
                Hidden once COMPLETED: contributing again would only push
                currentAmount further past the target, and nothing can take it
                back off — the service has no subtract and the amount must be
                >= 0.01. Still offered on an EXPIRED goal, which the backend
                accepts and which flips it to COMPLETED if it clears the target.
              */}
              {goal.status !== 'COMPLETED' && (
                <button
                  type="button"
                  onClick={() => onContribute(goal)}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-pill bg-gradient-to-r from-brand-green to-brand-cyan px-3 py-1.5 text-xs font-semibold text-white shadow-soft transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <HandCoins className="h-3.5 w-3.5" />
                  Contribute
                </button>
              )}
              <button
                type="button"
                onClick={() => onEdit(goal)}
                disabled={busy}
                aria-label={`Edit ${goal.title}`}
                className="inline-flex items-center gap-1.5 rounded-pill border border-sky-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-navy-700 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(goal)}
                disabled={busy}
                aria-label={`Delete ${goal.title}`}
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
