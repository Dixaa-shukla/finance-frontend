import { useState } from 'react';
import { Download, Filter, RotateCcw, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { todayISO } from '@/utils/format';
import {
  EMPTY_TRANSACTION_FILTERS,
  TRANSACTION_SORTS,
  type TransactionFilters,
} from '@/types/transaction';

/**
 * The filter bar for GET /transactions/user/{userId}.
 *
 * Every control maps to one query param TransactionFilterRequest actually
 * declares — type, category, startDate, endDate, minAmount, maxAmount — plus the
 * Pageable `sort`. There is no field here the backend would silently ignore.
 *
 * It keeps a draft copy and only calls onApply on submit, so typing a category
 * doesn't fire a request per keystroke.
 */
interface TransactionFilterBarProps {
  sort: string;
  exporting: boolean;
  searching: boolean;
  onApply: (filters: TransactionFilters) => void;
  onSortChange: (sort: string) => void;
  onExport: () => void;
  onDeepSearch: (term: string) => void;
}

const inputClass =
  'w-full rounded-xl border border-sky-200 bg-white/70 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-700/30 focus:bg-white';

const labelClass = 'mb-1.5 block text-xs font-semibold text-navy-700/70';

export function TransactionFilterBar({
  sort,
  exporting,
  searching,
  onApply,
  onSortChange,
  onExport,
  onDeepSearch,
}: TransactionFilterBarProps) {
  const [draft, setDraft] = useState<TransactionFilters>(
    EMPTY_TRANSACTION_FILTERS
  );
  const [open, setOpen] = useState(false);
  const [deepTerm, setDeepTerm] = useState('');

  function update(key: keyof TransactionFilters, value: string) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onApply(draft);
  }

  function handleReset() {
    setDraft(EMPTY_TRANSACTION_FILTERS);
    onApply(EMPTY_TRANSACTION_FILTERS);
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card p-5">
      {/*
        The one text filter the backend has is `category` — matchesFilter() does a
        contains() on both sides lowercased, so a partial word is enough.
      */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-700/35" />
          <input
            type="text"
            value={draft.category}
            onChange={(e) => update('category', e.target.value)}
            placeholder="Search by category…"
            aria-label="Search by category"
            className={`${inputClass} pl-10`}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            icon={<Filter className="h-4 w-4" />}
            onClick={() => setOpen((prev) => !prev)}
          >
            {open ? 'Hide Filters' : 'Filters'}
          </Button>
          <Button type="submit">Apply</Button>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-sky-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <label
            htmlFor="transaction-sort"
            className="text-xs font-semibold text-navy-700/70"
          >
            Sort
          </label>
          {/* Only transactionDate and amount — see TRANSACTION_SORTS. */}
          <select
            id="transaction-sort"
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
            className="rounded-xl border border-sky-200 bg-white/70 px-3 py-2 text-sm font-medium text-navy-900 focus:bg-white"
          >
            {TRANSACTION_SORTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Exports every row matching the APPLIED filter, not just this page. */}
        <Button
          type="button"
          variant="secondary"
          icon={<Download className="h-4 w-4" />}
          loading={exporting}
          onClick={onExport}
        >
          {exporting ? 'Preparing…' : 'Export CSV'}
        </Button>
      </div>

      {open && (
        <>
          <div className="mt-5 grid grid-cols-1 gap-4 border-t border-sky-100 pt-5 sm:grid-cols-2 xl:grid-cols-3">
            <div>
              <label htmlFor="filter-type" className={labelClass}>
                Type
              </label>
              {/* The enum has exactly these two values. "" means send no param. */}
              <select
                id="filter-type"
                value={draft.type}
                onChange={(e) => update('type', e.target.value)}
                className={inputClass}
              >
                <option value="">Expenses and income</option>
                <option value="EXPENSE">Expenses only</option>
                <option value="INCOME">Income only</option>
              </select>
            </div>

            {/*
              max=today is a real constraint, not a guess: every row here comes
              from an Expense or an Income, and both DTOs mark their date
              @PastOrPresent — so no transaction can ever be dated in the future.
            */}
            <div>
              <label htmlFor="filter-start" className={labelClass}>
                From Date
              </label>
              <input
                id="filter-start"
                type="date"
                max={todayISO()}
                value={draft.startDate}
                onChange={(e) => update('startDate', e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="filter-end" className={labelClass}>
                To Date
              </label>
              <input
                id="filter-end"
                type="date"
                max={todayISO()}
                value={draft.endDate}
                onChange={(e) => update('endDate', e.target.value)}
                className={inputClass}
              />
            </div>

            {/*
              ⚠️ BOTH COMPARE THE POSITIVE `amount`, NOT `signedAmount`.
              matchesFilter() tests getAmount(), so "min 500" means "at least ₹500
              moved", and it matches a ₹500 expense as readily as ₹500 of income.
            */}
            <div>
              <label htmlFor="filter-min" className={labelClass}>
                Min Amount (₹)
              </label>
              <input
                id="filter-min"
                type="number"
                min={0}
                step="0.01"
                value={draft.minAmount}
                onChange={(e) => update('minAmount', e.target.value)}
                placeholder="0"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="filter-max" className={labelClass}>
                Max Amount (₹)
              </label>
              <input
                id="filter-max"
                type="number"
                min={0}
                step="0.01"
                value={draft.maxAmount}
                onChange={(e) => update('maxAmount', e.target.value)}
                placeholder="No limit"
                className={inputClass}
              />
            </div>

            <div className="flex items-end">
              <Button
                type="button"
                variant="ghost"
                icon={<RotateCcw className="h-4 w-4" />}
                onClick={handleReset}
                className="w-full"
              >
                Reset All
              </Button>
            </div>

          </div>

          {/*
            The fulltext route, kept behind the Filters toggle so the default view
            stays uncluttered — and clearly labelled, because it behaves nothing
            like the filters above it: it searches merchant and notes (which no
            filter above can reach), it ignores every filter, it returns a flat
            unpaged list, and it only ever looks at EXPENSES.
          */}
          <div className="mt-5 rounded-card border border-lavender-200 bg-lavender-100/40 p-4">
            <label htmlFor="deep-search" className={labelClass}>
              Deep search — merchant &amp; notes text
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="deep-search"
                type="text"
                value={deepTerm}
                onChange={(e) => setDeepTerm(e.target.value)}
                /* Enter here must not submit the outer filter form. */
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onDeepSearch(deepTerm);
                  }
                }}
                placeholder="e.g. swiggy, cab fare, reimbursed…"
                className={`${inputClass} flex-1`}
              />
              <Button
                type="button"
                icon={<Sparkles className="h-4 w-4" />}
                loading={searching}
                disabled={deepTerm.trim() === ''}
                onClick={() => onDeepSearch(deepTerm)}
              >
                Deep Search
              </Button>
            </div>
            <p className="mt-2 text-xs text-navy-700/55">
              Searches expense merchants and notes only — income rows are not
              included, and the filters above do not apply to it.
            </p>
          </div>

        </>
      )}

    </form>
  );
}
