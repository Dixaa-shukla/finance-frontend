import { Search, X } from 'lucide-react';
import { GOAL_STATUS_LABELS, type GoalStatusScope } from '@/types/goal';

/**
 * Status tabs plus a title search.
 *
 * ⚠️ BOTH FILTER IN THE BROWSER, WITH NO REQUEST. GET /goals/user/{userId} takes
 * no query parameters, and `status` is not even a column — it is derived on every
 * read — so a status filter could not be pushed to the server without changing
 * the backend. There is no title-search route either.
 */
interface GoalToolbarProps {
  scope: GoalStatusScope;
  search: string;
  counts: { ALL: number; IN_PROGRESS: number; COMPLETED: number; EXPIRED: number };
  shown: number;
  onScopeChange: (scope: GoalStatusScope) => void;
  onSearchChange: (search: string) => void;
}

const TABS: { value: GoalStatusScope; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'IN_PROGRESS', label: GOAL_STATUS_LABELS.IN_PROGRESS },
  { value: 'COMPLETED', label: GOAL_STATUS_LABELS.COMPLETED },
  { value: 'EXPIRED', label: GOAL_STATUS_LABELS.EXPIRED },
];

export function GoalToolbar({
  scope,
  search,
  counts,
  shown,
  onScopeChange,
  onSearchChange,
}: GoalToolbarProps) {
  const filtered = scope !== 'ALL' || search.trim() !== '';

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

        <div className="relative lg:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-700/35" />
          <input
            id="goal-search"
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search goals by title"
            aria-label="Search goals by title"
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

      {filtered && (
        <p className="mt-3 text-xs text-navy-700/50">
          Showing {shown} of {counts.ALL} goals
        </p>
      )}
    </div>
  );
}
