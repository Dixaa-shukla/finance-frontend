import { Search, X } from 'lucide-react';
import type { RecurringScope } from '@/types/recurring';

/**
 * Status tabs, a type dropdown and a title search.
 *
 * ⚠️ ALL THREE FILTER IN THE BROWSER, WITH NO REQUEST.
 * GET /recurring-transactions/user/{userId} takes no query parameters at all, so
 * unlike the expense and income modules there is no /search route to push any of
 * this down to. OVERDUE is not a stored field either — it is computed as
 * `active && nextDueDate <= today`, which is exactly the set
 * findByIsActiveTrueAndNextDueDateLessThanEqual would return.
 */
interface RecurringToolbarProps {
  scope: RecurringScope;
  typeFilter: string;
  search: string;
  counts: { ALL: number; ACTIVE: number; PAUSED: number; OVERDUE: number };
  shown: number;
  onScopeChange: (scope: RecurringScope) => void;
  onTypeChange: (type: string) => void;
  onSearchChange: (search: string) => void;
}

const TABS: { value: RecurringScope; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PAUSED', label: 'Paused' },
  { value: 'OVERDUE', label: 'Overdue' },
];

export function RecurringToolbar({
  scope,
  typeFilter,
  search,
  counts,
  shown,
  onScopeChange,
  onTypeChange,
  onSearchChange,
}: RecurringToolbarProps) {
  const filtered = scope !== 'ALL' || typeFilter !== '' || search.trim() !== '';

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

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* The enum has exactly these two values. "" means "no filter". */}
          <select
            value={typeFilter}
            onChange={(e) => onTypeChange(e.target.value)}
            aria-label="Filter by type"
            className="rounded-xl border border-sky-200 bg-white/70 px-3 py-2.5 text-sm font-medium text-navy-900 focus:bg-white"
          >
            <option value="">Expenses and income</option>
            <option value="EXPENSE">Expense rules</option>
            <option value="INCOME">Income rules</option>
          </select>

          <div className="relative lg:w-64">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-700/35" />
            <input
              id="recurring-search"
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search rules by title"
              aria-label="Search rules by title"
              className="w-full rounded-xl border border-sky-200 bg-white/70 py-2.5 pl-10 pr-10 text-sm text-navy-900 placeholder:text-navy-700/30 focus:bg-white"
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-lg text-navy-700/45 hover:bg-sky-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {filtered && (
        <p className="mt-3 text-xs text-navy-700/50">
          Showing {shown} of {counts.ALL} rules
        </p>
      )}
    </div>
  );
}

