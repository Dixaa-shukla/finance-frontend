import { Search, X } from 'lucide-react';
import {
  INVESTMENT_TYPES,
  type InvestmentType,
} from '@/types/investment';

/**
 * Asset-type filter plus a name search.
 *
 * ⚠️ THE TWO CONTROLS WORK DIFFERENTLY, BECAUSE THE BACKEND ONLY SUPPORTS ONE.
 * The type dropdown is a real request — GET /investments/user/{userId} takes
 * ?type= and the server runs findByUserIdAndType. There is no equivalent route
 * for a name query, so the search box filters what has already loaded.
 *
 * ⚠️ ONLY TYPES THE USER ACTUALLY HOLDS ARE OFFERED. The counts come from
 * summary.breakdownByType, which only contains types with at least one row, so
 * listing all eleven constants would mean nine options that return nothing.
 */
interface InvestmentToolbarProps {
  typeFilter: InvestmentType | '';
  search: string;
  countsByType: Record<InvestmentType, number>;
  totalCount: number;
  shown: number;
  onTypeChange: (type: InvestmentType | '') => void;
  onSearchChange: (search: string) => void;
}

export function InvestmentToolbar({
  typeFilter,
  search,
  countsByType,
  totalCount,
  shown,
  onTypeChange,
  onSearchChange,
}: InvestmentToolbarProps) {
  const held = INVESTMENT_TYPES.filter((item) => countsByType[item.value] > 0);
  const filtered = typeFilter !== '' || search.trim() !== '';

  return (
    <div className="glass-card p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onTypeChange('')}
            aria-pressed={typeFilter === ''}
            className={`rounded-pill px-4 py-2 text-sm font-semibold transition-all duration-150 ${
              typeFilter === ''
                ? 'bg-gradient-to-r from-brand-blue to-brand-purple text-white shadow-soft'
                : 'border border-sky-200 bg-white/70 text-navy-700 hover:bg-white'
            }`}
          >
            All
            <span
              className={`ml-2 text-xs font-bold ${
                typeFilter === '' ? 'text-white/70' : 'text-navy-700/40'
              }`}
            >
              {totalCount}
            </span>
          </button>

          {held.map((item) => {
            const active = typeFilter === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => onTypeChange(item.value)}
                aria-pressed={active}
                className={`rounded-pill px-4 py-2 text-sm font-semibold transition-all duration-150 ${
                  active
                    ? 'bg-gradient-to-r from-brand-blue to-brand-purple text-white shadow-soft'
                    : 'border border-sky-200 bg-white/70 text-navy-700 hover:bg-white'
                }`}
              >
                {item.label}
                <span
                  className={`ml-2 text-xs font-bold ${
                    active ? 'text-white/70' : 'text-navy-700/40'
                  }`}
                >
                  {countsByType[item.value]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative lg:w-64">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-700/35" />
          <input
            id="investment-search"
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name"
            aria-label="Search investments by name"
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
          Showing {shown} of {totalCount} holdings. Portfolio totals above always
          cover everything you own.
        </p>
      )}
    </div>
  );
}
