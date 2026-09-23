import { Briefcase, CalendarDays, IndianRupee, Repeat } from 'lucide-react';
import { formatINR } from '@/utils/format';
import { INCOME_SOURCES, type IncomeResponse } from '@/types/income';

function sourceLabel(value: string): string {
  const match = INCOME_SOURCES.find((source) => source.value === value);
  return match ? match.label : value;
}

/**
 * The four summary tiles.
 *
 * ⚠️ EVERY NUMBER HERE IS CALCULATED FROM THE INCOME THE BACKEND RETURNED.
 * Nothing is hardcoded or sampled — an account with no income shows ₹0 and "—",
 * not a demo figure.
 */
export function IncomeStats({ incomes }: { incomes: IncomeResponse[] }) {
  const total = incomes.reduce((sum, i) => sum + i.amount, 0);

  // "This month" = same calendar year + month as today, read off the ISO string.
  const now = new Date();
  const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const thisMonth = incomes
    .filter((i) => i.incomeDate.startsWith(prefix))
    .reduce((sum, i) => sum + i.amount, 0);

  // `recurring` is the response spelling of the isRecurring flag — see types/income.ts.
  const recurringEntries = incomes.filter((i) => i.recurring);
  const recurringTotal = recurringEntries.reduce((sum, i) => sum + i.amount, 0);

  // Biggest source by total earned.
  const bySource = new Map<string, number>();
  for (const i of incomes) {
    bySource.set(i.source, (bySource.get(i.source) ?? 0) + i.amount);
  }
  let topSource = '';
  let topAmount = 0;
  for (const [source, amount] of bySource) {
    if (amount > topAmount) {
      topSource = source;
      topAmount = amount;
    }
  }

  const cards = [
    {
      label: 'Total Income',
      value: formatINR(total),
      note:
        incomes.length === 1
          ? '1 entry recorded'
          : `${incomes.length} entries recorded`,
      icon: IndianRupee,
      tint: 'from-brand-green to-brand-cyan',
    },
    {
      label: 'This Month',
      value: formatINR(thisMonth),
      note: now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
      icon: CalendarDays,
      tint: 'from-brand-cyan to-brand-blue',
    },
    {
      label: 'Recurring Income',
      value: formatINR(recurringTotal),
      note:
        recurringEntries.length === 1
          ? '1 recurring entry'
          : `${recurringEntries.length} recurring entries`,
      icon: Repeat,
      tint: 'from-brand-blue to-brand-purple',
    },
    {
      label: 'Top Source',
      value: topSource ? sourceLabel(topSource) : '—',
      note: topSource ? formatINR(topAmount) : 'No income yet',
      icon: Briefcase,
      tint: 'from-brand-purple to-brand-sky',
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
