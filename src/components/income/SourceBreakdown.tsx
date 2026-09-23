import { formatINR } from '@/utils/format';
import { INCOME_SOURCES, type IncomeResponse } from '@/types/income';

/** One gradient per bar, reused in order. Purely cosmetic. */
const BAR_TINTS = [
  'from-brand-green to-brand-cyan',
  'from-brand-cyan to-brand-blue',
  'from-brand-blue to-brand-purple',
  'from-brand-purple to-brand-sky',
  'from-brand-sky to-brand-cyan',
  'from-brand-purple to-brand-blue',
];

/**
 * "Income by Source" — a share-of-total bar per source.
 *
 * Sources are a fixed backend enum (IncomeSource), so unlike the expense
 * category breakdown this list is bounded at six and every bar is guaranteed to
 * carry a known label. Only sources the user has actually earned from appear.
 */
export function SourceBreakdown({ incomes }: { incomes: IncomeResponse[] }) {
  const total = incomes.reduce((sum, i) => sum + i.amount, 0);

  const bySource = new Map<string, number>();
  for (const i of incomes) {
    bySource.set(i.source, (bySource.get(i.source) ?? 0) + i.amount);
  }

  const rows = [...bySource.entries()]
    .map(([source, amount]) => ({
      source,
      amount,
      label:
        INCOME_SOURCES.find((entry) => entry.value === source)?.label ?? source,
    }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="glass-card p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-bold text-navy-900">Income by Source</h2>
        <span className="text-xs font-semibold text-navy-700/50">
          {formatINR(total)} total
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-navy-700/50">
          Add your first income entry to see where your money comes from.
        </p>
      ) : (
        <div className="mt-5 space-y-4">
          {rows.map((row, index) => {
            const share = total > 0 ? (row.amount / total) * 100 : 0;

            return (
              <div key={row.source}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="truncate font-semibold text-navy-800">
                    {row.label}
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
