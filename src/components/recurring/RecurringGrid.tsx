import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  CalendarClock,
  Pause,
  Pencil,
  Play,
  Trash2,
} from 'lucide-react';
import { formatDate, formatINRExact } from '@/utils/format';
import { daysUntilISO } from '@/utils/recurringSchedule';
import { INCOME_SOURCES } from '@/types/income';
import { PAYMENT_METHODS } from '@/types/expense';
import {
  FREQUENCY_LABELS,
  RECURRING_FREQUENCIES,
  type RecurringTransactionResponse,
} from '@/types/recurring';

/**
 * One card per rule.
 *
 * ⚠️ THE CARD SHOWS A RULE, NOT A TRANSACTION. The amount is what each occurrence
 * will be worth, and nothing here has been spent or earned yet — the rows this
 * rule has already produced live in the Expense and Income modules, with no link
 * back. RecurringTransaction is a template; that is the entity's own wording.
 *
 * ⚠️ "OVERDUE" IS DERIVED HERE AND IS A REAL SIGNAL, NOT COSMETIC. An active rule
 * whose nextDueDate is today or earlier is exactly what
 * findByIsActiveTrueAndNextDueDateLessThanEqual(today) selects, so an overdue chip
 * means the 01:00 sweep has not run since that date — the rows are owed and will
 * appear all at once when it does.
 *
 * ⚠️ A PAUSED RULE'S nextDueDate IS FROZEN AND MISLEADING. pause() only flips the
 * flag, so the stored date drifts into the past while the rule sits idle. The card
 * says "Paused" and never counts days for it, because resuming will back-fill
 * every occurrence between that stale date and today.
 */
interface RecurringGridProps {
  rules: RecurringTransactionResponse[];
  busy: boolean;
  onToggle: (rule: RecurringTransactionResponse) => void;
  onEdit: (rule: RecurringTransactionResponse) => void;
  onDelete: (rule: RecurringTransactionResponse) => void;
}

/** paymentMethod and incomeSource arrive as raw enum names; reuse the label lists. */
function methodLabel(value: string): string {
  const match = PAYMENT_METHODS.find((method) => method.value === value);
  return match ? match.label : value;
}

function sourceLabel(value: string): string {
  const match = INCOME_SOURCES.find((source) => source.value === value);
  return match ? match.label : value;
}

function everyLabel(frequency: RecurringTransactionResponse['frequency']): string {
  const match = RECURRING_FREQUENCIES.find((option) => option.value === frequency);
  return match ? match.every : FREQUENCY_LABELS[frequency];
}

/** How the next fire date reads. Days are only counted for an active rule. */
function dueText(rule: RecurringTransactionResponse): string {
  if (!rule.active) return `Paused · was due ${formatDate(rule.nextDueDate)}`;

  const days = daysUntilISO(rule.nextDueDate);
  if (days < 0) {
    const overdue = Math.abs(days);
    return `${overdue} day${overdue === 1 ? '' : 's'} overdue`;
  }
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due in ${days} days`;
}

export function RecurringGrid({
  rules,
  busy,
  onToggle,
  onEdit,
  onDelete,
}: RecurringGridProps) {
  // "Nothing matched the tab, type or search" is handled here rather than on the
  // page, so the toolbar stays on screen and the filter can be cleared.
  if (rules.length === 0) {
    return (
      <div className="glass-card p-10 text-center">
        <p className="text-sm font-semibold text-navy-900">
          No rules match this filter
        </p>
        <p className="mt-1 text-xs text-navy-700/50">
          Try another tab, switch the type back to both, or clear the search box.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {rules.map((rule) => renderCard(rule, busy, onToggle, onEdit, onDelete))}
    </div>
  );
}

function renderCard(
  rule: RecurringTransactionResponse,
  busy: boolean,
  onToggle: (rule: RecurringTransactionResponse) => void,
  onEdit: (rule: RecurringTransactionResponse) => void,
  onDelete: (rule: RecurringTransactionResponse) => void
) {
  const isIncome = rule.type === 'INCOME';
  // `<= 0` because the sweep's predicate is nextDueDate <= today: a rule due
  // today is already owed, so it gets the same amber treatment as a late one.
  // The chip still distinguishes the two — "Overdue" on a rule due today would
  // contradict the "Due today" line right below it.
  const days = daysUntilISO(rule.nextDueDate);
  const overdue = rule.active && days <= 0;
  const chipLabel = !rule.active
    ? 'Paused'
    : days < 0
      ? 'Overdue'
      : days === 0
        ? 'Due today'
        : 'Active';

  // Paused rules are greyed rather than tinted by type: the type still matters,
  // but "this is not running" is the more important thing to read first.
  const tint = !rule.active
    ? 'from-navy-700/40 to-navy-700/30'
    : isIncome
      ? 'from-brand-green to-brand-cyan'
      : 'from-brand-blue to-brand-purple';

  return (
    <div key={rule.id} className="glass-card flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${tint} text-white shadow-soft`}
          >
            {isIncome ? (
              <ArrowDownLeft className="h-5 w-5" />
            ) : (
              <ArrowUpRight className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-navy-900">{rule.title}</p>
            <p className="mt-0.5 text-xs text-navy-700/50">
              {FREQUENCY_LABELS[rule.frequency]} · {everyLabel(rule.frequency)}
            </p>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-pill px-2.5 py-1 text-[11px] font-bold ${
            !rule.active
              ? 'bg-white/70 text-navy-700/50'
              : overdue
                ? 'bg-amber-50 text-amber-700'
                : 'bg-emerald-50 text-brand-green'
          }`}
        >
          {chipLabel}
        </span>
      </div>

      <div className="mt-4">
        <p className="text-xl font-extrabold tracking-tight text-navy-900">
          {isIncome ? '+' : '−'}
          {formatINRExact(rule.amount)}
          <span className="ml-1 text-xs font-semibold text-navy-700/45">
            per occurrence
          </span>
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {/* Exactly one of these two is ever set — the type decides which. */}
          <span className="rounded-pill bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-brand-blue">
            {isIncome
              ? rule.incomeSource
                ? sourceLabel(rule.incomeSource)
                : 'No source'
              : (rule.category ?? 'No category')}
          </span>
          {/*
            Only meaningful for an expense rule, and optional even then —
            generateTransactionFor falls back to PaymentMethod.OTHER when it is
            null, so the card says which value will actually be written.
          */}
          {!isIncome && (
            <span className="rounded-pill bg-white/70 px-2 py-0.5 text-[11px] font-medium text-navy-700/45">
              {rule.paymentMethod ? methodLabel(rule.paymentMethod) : 'Other (default)'}
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 space-y-1.5 rounded-xl bg-sky-50/70 px-3 py-2.5 text-xs">
        <p
          className={`flex items-center gap-1.5 font-semibold ${
            !rule.active
              ? 'text-navy-700/50'
              : overdue
                ? 'text-amber-700'
                : 'text-navy-900'
          }`}
        >
          <CalendarClock className="h-3.5 w-3.5 shrink-0" />
          {dueText(rule)}
        </p>
        <p className="text-navy-700/55">
          Next {formatDate(rule.nextDueDate)} · started{' '}
          {formatDate(rule.startDate)}
        </p>
        <p className="text-navy-700/55">
          {rule.endDate ? `Ends ${formatDate(rule.endDate)}` : 'No end date — runs indefinitely'}
        </p>
      </div>

      {rule.notes && (
        <p className="mt-3 line-clamp-2 text-xs text-navy-700/55">{rule.notes}</p>
      )}

      {/*
        Only for an active, due-or-past rule. This is not decoration: these are
        exactly the rules findByIsActiveTrueAndNextDueDateLessThanEqual(today)
        returns, so the rows are already owed and the next sweep writes all of
        them at once.
      */}
      {overdue && (
        <p className="mt-3 flex items-start gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            This rule is due now and the nightly run has not reached it yet. Every
            occurrence it owes will be created the next time that run happens.
          </span>
        </p>
      )}

      <div className="mt-auto flex flex-wrap items-center justify-end gap-2 border-t border-sky-100 pt-3">
        {/*
          Pause and resume are two different PATCH routes, so this button sends
          whichever one matches the rule's current state. Resuming a long-paused
          rule back-fills from its frozen nextDueDate, which the label cannot
          say in three words — the form modal spells it out.
        */}
        <button
          type="button"
          onClick={() => onToggle(rule)}
          disabled={busy}
          aria-label={`${rule.active ? 'Pause' : 'Resume'} ${rule.title}`}
          className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-xs font-semibold text-white shadow-soft transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${
            rule.active
              ? 'bg-gradient-to-r from-navy-700 to-navy-800'
              : 'bg-gradient-to-r from-brand-green to-brand-cyan'
          }`}
        >
          {rule.active ? (
            <Pause className="h-3.5 w-3.5" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
          {rule.active ? 'Pause' : 'Resume'}
        </button>
        <button
          type="button"
          onClick={() => onEdit(rule)}
          disabled={busy}
          aria-label={`Edit ${rule.title}`}
          className="inline-flex items-center gap-1.5 rounded-pill border border-sky-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-navy-700 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(rule)}
          disabled={busy}
          aria-label={`Delete ${rule.title}`}
          className="inline-flex items-center gap-1.5 rounded-pill border border-red-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>
      </div>

    </div>
  );
}


