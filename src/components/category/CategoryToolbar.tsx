import { Search, X } from 'lucide-react';
import { CATEGORY_TYPES, type CategoryScope } from '@/types/category';

/**
 * Scope tabs plus a name search.
 *
 * ⚠️ BOTH CONTROLS FILTER IN THE BROWSER, WITH NO REQUEST. GET
 * /categories/user/{userId} returns the defaults plus this user's own rows in one
 * go — a few dozen at most, already sorted by name server-side — so refetching to
 * hide half of them would be a wasted round trip. The `type` query param does
 * exist on that route; it just isn't worth a network call here.
 *
 * There is no server-side name search on the category controller at all, which is
 * the other reason the box below is local: offering a search that posted to the
 * server would mean inventing an endpoint that does not exist.
 */
interface CategoryToolbarProps {
  scope: CategoryScope;
  search: string;
  counts: { ALL: number; EXPENSE: number; INCOME: number };
  shown: number;
  onScopeChange: (scope: CategoryScope) => void;
  onSearchChange: (search: string) => void;
}

const TABS: { value: CategoryScope; label: string }[] = [
  { value: 'ALL', label: 'All' },
  ...CATEGORY_TYPES.map((type) => ({ value: type.value, label: type.label })),
];

export function CategoryToolbar({
  scope,
  search,
  counts,
  shown,
  onScopeChange,
  onSearchChange,
}: CategoryToolbarProps) {
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

        <div className="relative w-full lg:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-700/35" />
          <input
            id="category-search"
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search categories by name"
            aria-label="Search categories by name"
            className="w-full rounded-xl border border-sky-200 bg-white/70 py-2.5 pl-10 pr-10 text-sm text-navy-900 placeholder:text-navy-700/30 focus:bg-white"
          />
          {search !== '' && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-navy-700/45 hover:bg-sky-100 hover:text-navy-800"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {(search !== '' || scope !== 'ALL') && (
        <p className="mt-3 text-xs text-navy-700/50">
          Showing {shown} of {counts.ALL} categories
        </p>
      )}
    </div>
  );
}
