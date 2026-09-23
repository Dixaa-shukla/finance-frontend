import { formatINR } from '@/utils/format';
import {
  INVESTMENT_TYPE_LABELS,
  type InvestmentSummaryResponse,
  type InvestmentType,
} from '@/types/investment';

/**
 * Allocation by asset type — the breakdownByType array rendered as a share bar
 * plus a per-type table.
 *
 * ⚠️ THE SHARE PERCENTAGES ARE COMPUTED HERE; THE RETURN PERCENTAGES ARE NOT.
 * InvestmentTypeBreakdown carries count, investedAmount, currentValue,
 * gainLossAmount and gainLossPercent — but no "share of portfolio" field. Share
 * is each type's currentValue over the portfolio's totalCurrentValue, which is
 * arithmetic on values the server already sent, not a re-derivation of its
 * figures. gainLossPercent is printed exactly as received.
 *
 * ⚠️ THE ROWS ARRIVE SORTED BY ENUM NAME, NOT BY SIZE.
 * getPortfolioSummary sorts on b.getType().name(), so the server's order is
 * alphabetical (BOND, CRYPTO, EPF, ...). Largest-first is far more useful for an
 * allocation view, so this component re-sorts — a display choice, stated because
 * it differs from the payload order.
 */
const TYPE_COLORS: Record<InvestmentType, string> = {
  STOCK: 'bg-brand-blue',
  MUTUAL_FUND: 'bg-brand-purple',
  SIP: 'bg-brand-sky',
  FIXED_DEPOSIT: 'bg-brand-cyan',
  PPF: 'bg-brand-green',
  EPF: 'bg-emerald-400',
  NPS: 'bg-teal-400',
  GOLD: 'bg-amber-400',
  CRYPTO: 'bg-orange-400',
  BOND: 'bg-indigo-400',
  OTHER: 'bg-navy-700/40',
};

export function InvestmentAllocation({
  summary,
}: {
  summary: InvestmentSummaryResponse;
}) {
  const total = summary.totalCurrentValue;
  const rows = [...summary.breakdownByType].sort(
    (a, b) => b.currentValue - a.currentValue
  );

  // Guarded because a portfolio of zero-value holdings is legal — currentValue
  // has @DecimalMin("0.0"), not 0.01 — and would divide by zero here.
  const share = (value: number) => (total > 0 ? (value / total) * 100 : 0);

  return (
    <div className="glass-card p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-bold text-navy-900">Allocation by Type</h2>
        <p className="text-xs text-navy-700/50">
          {formatINR(total)} current value
        </p>
      </div>

      {/* One continuous bar: the clearest read of "how much sits where". */}
      <div className="mt-4 flex h-3 w-full overflow-hidden rounded-pill bg-sky-100">
        {rows.map((row) => (
          <div
            key={row.type}
            className={TYPE_COLORS[row.type]}
            style={{ width: `${share(row.currentValue)}%` }}
            title={`${INVESTMENT_TYPE_LABELS[row.type]} — ${formatINR(
              row.currentValue
            )}`}
          />
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {rows.map((row) => {
          const up = row.gainLossAmount > 0;
          const down = row.gainLossAmount < 0;
          return (
            <div key={row.type} className="flex items-center gap-3">
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${TYPE_COLORS[row.type]}`}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-navy-900">
                  {INVESTMENT_TYPE_LABELS[row.type]}
                </p>
                <p className="text-[11px] text-navy-700/45">
                  {row.count} holding{row.count === 1 ? '' : 's'} ·{' '}
                  {formatINR(row.investedAmount)} invested
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs font-bold text-navy-900">
                  {formatINR(row.currentValue)}
                </p>
                <p
                  className={`text-[11px] font-semibold ${
                    up
                      ? 'text-brand-green'
                      : down
                        ? 'text-red-500'
                        : 'text-navy-700/45'
                  }`}
                >
                  {share(row.currentValue).toFixed(1)}% ·{' '}
                  {up ? '+' : down ? '−' : ''}
                  {Math.abs(row.gainLossPercent).toFixed(2)}%
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
