import { CalendarDays, IndianRupee, Layers, Receipt } from 'lucide-react';
import { formatINR } from '@/utils/format';
import type { ExpenseResponse } from '@/types/expense';

/**
 * The four summary tiles.
 *
 * ⚠️ EVERY NUMBER HERE IS CALCULATED FROM THE EXPENSES THE BACKEND RETURNED.
 * Nothing is hardcoded or sampled — an account with no expenses shows ₹0 and
 * "—", not a demo figure.
 */
export function ExpenseStats({ expenses }: { expenses: ExpenseResponse[] }) {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  // "This month" = same calendar year + month as today, read off the ISO string.
  const now = new Date();
  const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const thisMonth = expenses
    .filter((e) => e.expenseDate.startsWith(prefix))
    .reduce((sum, e) => sum + e.amount, 0);

  // Biggest category by total spend.
  const byCategory = new Map<string, number>();
  for (const e of expenses) {
    byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amount);
  }
  let topCategory = '';
  let topAmount = 0;
  for (const [category, amount] of byCategory) {
    if (amount > topAmount) {
      topCategory = category;
      topAmount = amount;
    }
  }

  const cards = [
    {
      label: 'Total Expenses',
      value: formatINR(total),
      note: 'All recorded spending',
      icon: IndianRupee,
      tint: 'from-brand-blue to-brand-purple',
    },
    {
      label: 'This Month',
      value: formatINR(thisMonth),
      note: now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
      icon: CalendarDays,
      tint: 'from-brand-purple to-brand-sky',
    },
    {
      label: 'Transactions',
      value: String(expenses.length),
      note: expenses.length === 1 ? 'expense recorded' : 'expenses recorded',
      icon: Receipt,
      tint: 'from-brand-cyan to-brand-blue',
    },
    {
      label: 'Top Category',
      value: topCategory || '—',
      note: topCategory ? formatINR(topAmount) : 'No expenses yet',
      icon: Layers,
      tint: 'from-brand-green to-brand-cyan',
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
