import { useState } from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { todayISO } from '@/utils/format';
import type { CategoryOption } from '@/types/category';
import {
  EMPTY_INCOME_FILTERS,
  INCOME_SOURCES,
  type IncomeFilters,
} from '@/types/income';

/**
 * The filter bar for GET /incomes/user/{userId}/search.
 *
 * Every input here maps to one query param IncomeController actually declares —
 * source, categoryId, startDate, endDate, minAmount, maxAmount, isRecurring.
 * There is no extra field that the backend would silently ignore.
 *
 * Unlike the expense filter bar there is no free-text search box: the income
 * endpoint has no merchant/notes text param, so offering one would be a control
 * that does nothing. The source dropdown is the primary filter instead, and it
 * applies immediately since picking from a list is a deliberate act — no
 * "Apply" round-trip needed for it.
 */
interface IncomeFilterBarProps {
  filters: IncomeFilters;
  categories: CategoryOption[];
  onApply: (filters: IncomeFilters) => void;
}

const inputClass =
  'w-full rounded-xl border border-sky-200 bg-white/70 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-700/30 focus:bg-white';

export function IncomeFilterBar({
  filters,
  categories,
  onApply,
}: IncomeFilterBarProps) {
  const [draft, setDraft] = useState<IncomeFilters>(filters);
  const [open, setOpen] = useState(false);

  function update(key: keyof IncomeFilters, value: string) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  /** Source is a dropdown, so applying on change is what the user expects. */
  function updateSourceAndApply(value: string) {
    const next = { ...draft, source: value };
    setDraft(next);
    onApply(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onApply(draft);
  }

  function handleReset() {
    setDraft(EMPTY_INCOME_FILTERS);
    onApply(EMPTY_INCOME_FILTERS);
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card p-5">
      {/* Always-visible row: source + the toggle for the rest. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <select
            value={draft.source}
            onChange={(e) => updateSourceAndApply(e.target.value)}
            aria-label="Filter by income source"
            className={inputClass}
          >
            <option value="">All sources</option>
            {INCOME_SOURCES.map((source) => (
              <option key={source.value} value={source.value}>
                {source.label}
              </option>
            ))}
          </select>
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
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div>
            <label
              htmlFor="income-filter-recurring"
              className="mb-1.5 block text-xs font-semibold text-navy-700/70"
            >
              Recurring
            </label>
            <select
              id="income-filter-recurring"
              value={draft.isRecurring}
              onChange={(e) => update('isRecurring', e.target.value)}
              className={inputClass}
            >
              <option value="">Any</option>
              <option value="true">Recurring only</option>
              <option value="false">One-off only</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="income-filter-category"
              className="mb-1.5 block text-xs font-semibold text-navy-700/70"
            >
              Category
            </label>
            <select
              id="income-filter-category"
              value={draft.categoryId}
              onChange={(e) => update('categoryId', e.target.value)}
              className={inputClass}
              disabled={categories.length === 0}
            >
              <option value="">
                {categories.length === 0
                  ? 'No income categories yet'
                  : 'Any category'}
              </option>
              {categories.map((category) => (
                <option key={category.id} value={String(category.id)}>
                  {category.name}
                </option>
              ))}
            </select>
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

          <div>
            <label
              htmlFor="income-filter-start"
              className="mb-1.5 block text-xs font-semibold text-navy-700/70"
            >
              From Date
            </label>
            <input
              id="income-filter-start"
              type="date"
              max={todayISO()}
              value={draft.startDate}
              onChange={(e) => update('startDate', e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="income-filter-end"
              className="mb-1.5 block text-xs font-semibold text-navy-700/70"
            >
              To Date
            </label>
            <input
              id="income-filter-end"
              type="date"
              max={todayISO()}
              value={draft.endDate}
              onChange={(e) => update('endDate', e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="income-filter-min"
                className="mb-1.5 block text-xs font-semibold text-navy-700/70"
              >
                Min (₹)
              </label>
              <input
                id="income-filter-min"
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
                htmlFor="income-filter-max"
                className="mb-1.5 block text-xs font-semibold text-navy-700/70"
              >
                Max (₹)
              </label>
              <input
                id="income-filter-max"
                type="number"
                min={0}
                step="0.01"
                value={draft.maxAmount}
                onChange={(e) => update('maxAmount', e.target.value)}
                placeholder="No limit"
                className={inputClass}
              />
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
