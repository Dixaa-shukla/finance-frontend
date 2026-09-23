import { formatINR } from '@/utils/format';
import type { ExpenseResponse } from '@/types/expense';

/** One gradient per bar, reused in order. Purely cosmetic. */
const BAR_TINTS = [
  'from-brand-blue to-brand-purple',
  'from-brand-purple to-brand-sky',
  'from-brand-cyan to-brand-blue',
  'from-brand-green to-brand-cyan',
  'from-brand-sky to-brand-cyan',
  'from-brand-purple to-brand-blue',
];

/**
 * "Top Spending Categories" — a share-of-total bar per category.
 *
 * Categories come from whatever the user actually typed on their expenses, not
 * from a fixed list, so this stays correct if they invent their own.
 */
export function CategoryBreakdown({
  expenses,
}: {
  expenses: ExpenseResponse[];
}) {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  const byCategory = new Map<string, number>();
  for (const e of expenses) {
    byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amount);
  }

  const rows = [...byCategory.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);

  return (
    <div className="glass-card p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-bold text-navy-900">
          Top Spending Categories
        </h2>
        <span className="text-xs font-semibold text-navy-700/50">
          {formatINR(total)} total
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-navy-700/50">
          Add your first expense to see how your spending splits up.
        </p>
      ) : (
        <div className="mt-5 space-y-4">
          {rows.map((row, index) => {
            const share = total > 0 ? (row.amount / total) * 100 : 0;

            return (
              <div key={row.category}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="truncate font-semibold text-navy-800">
                    {row.category}
                  </span>
                  <span className="shrink-0 text-navy-700/60">
                    {formatINR(row.amount)}
                    <span className="ml-2 text-xs text-navy-700/40">
                      {share.toFixed(0)}%
                    </span>
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-pill bg-sky-100">
                  <div
                    className={`h-full rounded-pill bg-gradient-to-r ${
                      BAR_TINTS[index % BAR_TINTS.length]
                    }`}
                    style={{ width: `${share}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
