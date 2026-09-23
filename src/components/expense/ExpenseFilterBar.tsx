import { useState } from 'react';
import { Filter, RotateCcw, Search } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { todayISO } from '@/utils/format';
import {
  CATEGORY_SUGGESTIONS,
  EMPTY_FILTERS,
  PAYMENT_METHODS,
  type ExpenseFilters,
} from '@/types/expense';

/**
 * The filter bar for GET /expenses/user/{userId}/search.
 *
 * Every input here maps to one query param the controller actually declares —
 * category, paymentMethod, merchant, startDate, endDate, minAmount, maxAmount,
 * tag. There is no extra field that the backend would silently ignore.
 *
 * It keeps its own draft copy and only calls onApply when the user submits, so
 * typing a merchant name doesn't fire a request per keystroke.
 */
interface ExpenseFilterBarProps {
  onApply: (filters: ExpenseFilters) => void;
}

const inputClass =
  'w-full rounded-xl border border-sky-200 bg-white/70 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-700/30 focus:bg-white';

export function ExpenseFilterBar({ onApply }: ExpenseFilterBarProps) {
  const [draft, setDraft] = useState<ExpenseFilters>(EMPTY_FILTERS);
  const [open, setOpen] = useState(false);

  function update(key: keyof ExpenseFilters, value: string) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onApply(draft);
  }

  function handleReset() {
    setDraft(EMPTY_FILTERS);
    onApply(EMPTY_FILTERS);
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card p-5">
      {/* Always-visible row: merchant search + the toggle for the rest. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-700/35" />
          <input
            type="text"
            value={draft.merchant}
            onChange={(e) => update('merchant', e.target.value)}
            placeholder="Search by merchant…"
            aria-label="Search by merchant"
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

      {open && (
        <>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div>
              <label
                htmlFor="filter-category"
                className="mb-1.5 block text-xs font-semibold text-navy-700/70"
              >
                Category
              </label>
              <input
                id="filter-category"
                type="text"
                list="expense-categories-filter"
                maxLength={50}
                value={draft.category}
                onChange={(e) => update('category', e.target.value)}
                placeholder="Any category"
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="filter-payment"
                className="mb-1.5 block text-xs font-semibold text-navy-700/70"
              >
                Payment Method
              </label>
              <select
                id="filter-payment"
                value={draft.paymentMethod}
                onChange={(e) => update('paymentMethod', e.target.value)}
                className={inputClass}
              >
                <option value="">Any method</option>
                {PAYMENT_METHODS.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="filter-start"
                className="mb-1.5 block text-xs font-semibold text-navy-700/70"
              >
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
              <label
                htmlFor="filter-end"
                className="mb-1.5 block text-xs font-semibold text-navy-700/70"
              >
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

            <div>
              <label
                htmlFor="filter-min"
                className="mb-1.5 block text-xs font-semibold text-navy-700/70"
              >
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
              <label
                htmlFor="filter-max"
                className="mb-1.5 block text-xs font-semibold text-navy-700/70"
              >
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

            <div>
              <label
                htmlFor="filter-tag"
                className="mb-1.5 block text-xs font-semibold text-navy-700/70"
              >
                Tag
              </label>
              <input
                id="filter-tag"
                type="text"
                maxLength={30}
                value={draft.tag}
                onChange={(e) => update('tag', e.target.value)}
                placeholder="e.g. recurring"
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

          {/* Suggestions only — the field still accepts any category. */}
          <datalist id="expense-categories-filter">
            {CATEGORY_SUGGESTIONS.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </>
      )}
    </form>
  );
}
