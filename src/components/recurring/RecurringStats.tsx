import { CalendarClock, Repeat, TrendingDown, TrendingUp } from 'lucide-react';
import { formatDate, formatINR } from '@/utils/format';
import { MONTHLY_FACTOR } from '@/utils/recurringSchedule';
import type { RecurringTransactionResponse } from '@/types/recurring';

/**
 * The four summary tiles.
 *
 * ⚠️ THE TWO MONEY TILES ARE NORMALISED ESTIMATES, NOT BACKEND FIGURES.
 * RecurringTransactionResponse carries a per-occurrence `amount` and a
 * `frequency`, and no endpoint returns a monthly total — so "₹200 daily" and
 * "₹18,000 monthly" cannot be compared or added without converting them first.
 * MONTHLY_FACTOR does that (30 days, 52/12 weeks, 1, 1/12), which is why both
 * labels say "approx." rather than presenting the number as exact.
 *
 * ⚠️ PAUSED RULES ARE EXCLUDED FROM BOTH MONEY TILES. A paused rule generates
 * nothing — the sweep filters on isActiveTrue — so counting it would overstate a
 * commitment the user has already stopped.
 */
export function RecurringStats({
  rules,
}: {
  rules: RecurringTransactionResponse[];
}) {
  const active = rules.filter((rule) => rule.active);
  const paused = rules.length - active.length;

  const monthly = (type: 'EXPENSE' | 'INCOME') =>
    active
      .filter((rule) => rule.type === type)
      .reduce((sum, rule) => sum + rule.amount * MONTHLY_FACTOR[rule.frequency], 0);

  const outflow = monthly('EXPENSE');
  const inflow = monthly('INCOME');

  // The list arrives sorted soonest-due first with paused rules last, so the
  // first active entry is the next one to fire.
  const next = active[0] ?? null;

  const cards = [
    {
      label: 'Active Rules',
      value: String(active.length),
      note:
        paused === 0
          ? `${rules.length} in total, none paused`
          : `${paused} paused, not generating`,
      icon: Repeat,
      tint: 'from-brand-blue to-brand-purple',
    },
    {
      label: 'Monthly Outflow',
      value: formatINR(outflow),
      note: 'approx. per month, expense rules',
      icon: TrendingDown,
      tint: 'from-red-400 to-red-500',
    },
    {
      label: 'Monthly Inflow',
      value: formatINR(inflow),
      note: 'approx. per month, income rules',
      icon: TrendingUp,
      tint: 'from-brand-green to-brand-cyan',
    },
    {
      label: 'Next Due',
      value: next ? formatDate(next.nextDueDate) : '—',
      note: next ? next.title : 'Nothing scheduled',
      icon: CalendarClock,
      tint: 'from-brand-cyan to-brand-blue',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="glass-card p-5">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-semibold text-navy-700/60">{card.label}</p>
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${card.tint} text-white shadow-soft`}
            >
              <card.icon className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 truncate text-2xl font-extrabold tracking-tight text-navy-900">
            {card.value}
          </p>
          <p className="mt-1 truncate text-xs text-navy-700/50">{card.note}</p>
        </div>
      ))}
    </div>
  );
}

