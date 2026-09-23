import { ArrowLeftRight, Layers, TrendingDown, TrendingUp } from 'lucide-react';
import { formatINR } from '@/utils/format';
import { SUMMARY_PAGE_SIZE } from '@/api/transactionService';
import type { TransactionResponse } from '@/types/transaction';

/**
 * The four summary tiles for Module 8.
 *
 * ⚠️ NET FLOW SUMS `signedAmount`, NOT `amount`. The backend sets signedAmount to
 * amount.negate() for expenses and leaves it positive for income precisely so a
 * mixed list can be added up in one pass — adding `amount` instead would report
 * total turnover and call an overspending month a surplus.
 *
 * `rows` is every row matching the current filter (not the page), so these
 * figures describe the filter. `total` is the server's own totalElements, which
 * is the only trustworthy count if the filter ever matches more rows than one
 * page can carry.
 */
interface TransactionStatsProps {
  rows: TransactionResponse[];
  total: number;
}

export function TransactionStats({ rows, total }: TransactionStatsProps) {
  const moneyIn = rows
    .filter((row) => row.type === 'INCOME')
    .reduce((sum, row) => sum + row.amount, 0);

  const moneyOut = rows
    .filter((row) => row.type === 'EXPENSE')
    .reduce((sum, row) => sum + row.amount, 0);

  const net = rows.reduce((sum, row) => sum + row.signedAmount, 0);

  const incomeCount = rows.filter((row) => row.type === 'INCOME').length;
  const expenseCount = rows.length - incomeCount;

  // Only possible if a single filter matches more than SUMMARY_PAGE_SIZE rows.
  const truncated = total > rows.length;

  const cards = [
    {
      label: 'Money In',
      value: formatINR(moneyIn),
      note:
        incomeCount === 0
          ? 'No income in this range'
          : `${incomeCount} income ${incomeCount === 1 ? 'entry' : 'entries'}`,
      icon: TrendingUp,
      tint: 'from-brand-green to-brand-cyan',
    },
    {
      label: 'Money Out',
      value: formatINR(moneyOut),
      note:
        expenseCount === 0
          ? 'No expenses in this range'
          : `${expenseCount} ${expenseCount === 1 ? 'expense' : 'expenses'}`,
      icon: TrendingDown,
      tint: 'from-red-400 to-red-500',
    },
    {
      label: 'Net Flow',
      value: `${net < 0 ? '−' : '+'}${formatINR(Math.abs(net))}`,
      note: net < 0 ? 'Spent more than you earned' : 'Earned more than you spent',
      icon: ArrowLeftRight,
      tint:
        net < 0 ? 'from-brand-purple to-brand-blue' : 'from-brand-blue to-brand-cyan',
    },
    {
      label: 'Transactions',
      value: String(total),
      note: truncated
        ? `Totals cover the first ${SUMMARY_PAGE_SIZE.toLocaleString('en-IN')}`
        : 'Expenses and income, merged',
      icon: Layers,
      tint: 'from-brand-sky to-brand-purple',
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
