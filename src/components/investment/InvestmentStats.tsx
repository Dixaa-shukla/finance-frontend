import { Briefcase, IndianRupee, TrendingDown, TrendingUp } from 'lucide-react';
import { formatINR } from '@/utils/format';
import type { InvestmentSummaryResponse } from '@/types/investment';

/**
 * The four portfolio tiles, straight from
 * GET /investments/user/{userId}/summary.
 *
 * ⚠️ NOTHING HERE IS RECALCULATED. totalInvested, totalCurrentValue,
 * totalGainLossAmount, totalGainLossPercent and totalInvestmentCount all arrive
 * from getPortfolioSummary(). Recomputing them from the visible rows would
 * disagree with the server the moment a type filter is applied, because the
 * summary route ignores that filter.
 *
 * ⚠️ A 0% RETURN IS AMBIGUOUS, SO THE SIGN OF THE AMOUNT DECIDES THE COLOUR.
 * percentChange() returns 0.0 both for "no change" and for "totalInvested <= 0",
 * so the percentage alone cannot say whether the portfolio is up.
 */
export function InvestmentStats({
  summary,
  maturedCount,
}: {
  summary: InvestmentSummaryResponse;
  maturedCount: number;
}) {
  const gain = summary.totalGainLossAmount;
  const up = gain > 0;
  const down = gain < 0;

  const cards = [
    {
      label: 'Total Invested',
      value: formatINR(summary.totalInvested),
      note: `${summary.totalInvestmentCount} holding${
        summary.totalInvestmentCount === 1 ? '' : 's'
      }`,
      icon: IndianRupee,
      tint: 'from-brand-blue to-brand-purple',
    },
    {
      label: 'Current Value',
      value: formatINR(summary.totalCurrentValue),
      note:
        maturedCount > 0
          ? `${maturedCount} matured`
          : 'as last updated by you',
      icon: Briefcase,
      tint: 'from-brand-cyan to-brand-blue',
    },
    {
      label: up ? 'Total Gain' : down ? 'Total Loss' : 'Net Change',
      // Printed as an absolute figure with an explicit sign, so a loss reads as
      // "−₹4,200" rather than the "-₹4,200" the formatter would produce.
      value: `${up ? '+' : down ? '−' : ''}${formatINR(Math.abs(gain))}`,
      note: `${summary.totalGainLossPercent >= 0 ? '+' : '−'}${Math.abs(
        summary.totalGainLossPercent
      ).toFixed(2)}% overall`,
      icon: up ? TrendingUp : TrendingDown,
      tint: up
        ? 'from-brand-green to-brand-cyan'
        : down
          ? 'from-red-400 to-red-500'
          : 'from-navy-700/40 to-navy-700/30',
    },
    {
      label: 'Asset Types',
      value: String(summary.breakdownByType.length),
      note:
        summary.breakdownByType.length <= 1
          ? 'spread across more types to diversify'
          : 'types held',
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
