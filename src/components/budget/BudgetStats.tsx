import { AlertTriangle, PiggyBank, TrendingDown, Wallet } from 'lucide-react';
import { formatINR } from '@/utils/format';
import type { BudgetResponse } from '@/types/budget';

/**
 * The four summary tiles.
 *
 * ⚠️ EVERY FIGURE IS SUMMED FROM WHAT THE SERVER SENT. spentAmount is computed by
 * BudgetServiceImpl from real Expense rows on each read, so nothing here
 * recalculates spend — it only adds up the values already in the response.
 *
 * ⚠️ THE ALERT COUNT COMES FROM `alertTriggered` ON THIS SAME LIST, NOT FROM
 * GET /budgets/user/{userId}/alerts. That endpoint returns these very objects
 * filtered by the same flag, so a second request could only add a chance of the
 * two disagreeing mid-refresh. See the note in api/budgetService.ts.
 */
export function BudgetStats({ budgets }: { budgets: BudgetResponse[] }) {
  const budgeted = budgets.reduce((sum, b) => sum + b.amount, 0);
  const spent = budgets.reduce((sum, b) => sum + b.spentAmount, 0);

  // Not `budgeted - spent`: a budget overspent by ₹500 contributes −500 to the
  // server's own remainingAmount, and that is the honest figure to carry through.
  const remaining = budgets.reduce((sum, b) => sum + b.remainingAmount, 0);

  const alerts = budgets.filter((b) => b.alertTriggered).length;
  const overallPercent = budgeted > 0 ? Math.round((spent / budgeted) * 100) : 0;

  const cards = [
    {
      label: 'Total Budgeted',
      value: formatINR(budgeted),
      note:
        budgets.length === 1 ? '1 budget active' : `${budgets.length} budgets active`,
      icon: PiggyBank,
      tint: 'from-brand-blue to-brand-purple',
    },
    {
      label: 'Total Spent',
      value: formatINR(spent),
      note: `${overallPercent}% of everything budgeted`,
      icon: TrendingDown,
      tint: 'from-brand-purple to-brand-sky',
    },
    {
      label: remaining < 0 ? 'Overspent By' : 'Remaining',
      value: formatINR(Math.abs(remaining)),
      note: remaining < 0 ? 'Across all budgets' : 'Still available to spend',
      icon: Wallet,
      tint: remaining < 0 ? 'from-red-400 to-red-500' : 'from-brand-green to-brand-cyan',
    },
    {
      label: 'Alerts Triggered',
      value: String(alerts),
      note:
        alerts === 0
          ? 'Every budget under its threshold'
          : 'At or past the alert threshold',
      icon: AlertTriangle,
      tint: alerts > 0 ? 'from-red-400 to-red-500' : 'from-brand-cyan to-brand-blue',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="glass-card p-5">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-semibold text-navy-700/60">
              {card.label}
            </p>
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
