import { AlertTriangle } from 'lucide-react';
import { BUDGET_PERIODS, type BudgetPeriodScope } from '@/types/budget';

/**
 * Period tabs plus an alerts-only toggle.
 *
 * ⚠️ BOTH FILTER IN THE BROWSER, WITH NO REQUEST. GET /budgets/user/{userId}
 * takes no query parameters at all — there is no period filter on the controller —
 * and it returns every budget with its spend already computed. Filtering the
 * array is therefore the only option as well as the fastest one.
 */
interface BudgetToolbarProps {
  scope: BudgetPeriodScope;
  alertsOnly: boolean;
  counts: { ALL: number; DAILY: number; WEEKLY: number; MONTHLY: number };
  alertCount: number;
  shown: number;
  onScopeChange: (scope: BudgetPeriodScope) => void;
  onAlertsOnlyChange: (alertsOnly: boolean) => void;
}

const TABS: { value: BudgetPeriodScope; label: string }[] = [
  { value: 'ALL', label: 'All' },
  ...BUDGET_PERIODS.map((period) => ({
    value: period.value,
    label: period.label,
  })),
];

export function BudgetToolbar({
  scope,
  alertsOnly,
  counts,
  alertCount,
  shown,
  onScopeChange,
  onAlertsOnlyChange,
}: BudgetToolbarProps) {
  return (
    <div className="glass-card p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {TABS.map((tab) => {
            const active = scope === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => onScopeChange(tab.value)}
                aria-pressed={active}
                className={`rounded-pill px-4 py-2 text-sm font-semibold transition-all duration-150 ${
                  active
                    ? 'bg-gradient-to-r from-brand-blue to-brand-purple text-white shadow-soft'
                    : 'border border-sky-200 bg-white/70 text-navy-700 hover:bg-white'
                }`}
              >
                {tab.label}
                <span
                  className={`ml-2 text-xs font-bold ${
                    active ? 'text-white/70' : 'text-navy-700/40'
                  }`}
                >
                  {counts[tab.value]}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onAlertsOnlyChange(!alertsOnly)}
          aria-pressed={alertsOnly}
          disabled={alertCount === 0 && !alertsOnly}
          className={`inline-flex items-center gap-2 rounded-pill px-4 py-2 text-sm font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${
            alertsOnly
              ? 'bg-red-500 text-white shadow-soft'
              : 'border border-sky-200 bg-white/70 text-navy-700 hover:bg-white'
          }`}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          Alerts only
          <span
            className={`text-xs font-bold ${
              alertsOnly ? 'text-white/75' : 'text-navy-700/40'
            }`}
          >
            {alertCount}
          </span>
        </button>
      </div>

      {(alertsOnly || scope !== 'ALL') && (
        <p className="mt-3 text-xs text-navy-700/50">
          Showing {shown} of {counts.ALL} budgets
        </p>
      )}
    </div>
  );
}
