import {
  Briefcase,
  Building2,
  ChartLine,
  ChevronLeft,
  ChevronRight,
  Coins,
  Gift,
  Laptop,
  Pencil,
  Repeat,
  Tags,
  Trash2,
} from 'lucide-react';
import { formatDate, formatINRExact } from '@/utils/format';
import { INCOME_SOURCES, type IncomeResponse } from '@/types/income';

/** Icon per IncomeSource, so a row is scannable without reading the label. */
const SOURCE_ICONS = {
  SALARY: Briefcase,
  FREELANCE: Laptop,
  RENTAL: Building2,
  INVESTMENT: ChartLine,
  BONUS: Gift,
  OTHER: Coins,
};

function sourceLabel(value: string): string {
  const match = INCOME_SOURCES.find((source) => source.value === value);
  return match ? match.label : value;
}

interface IncomeTableProps {
  incomes: IncomeResponse[];
  page: number;
  totalPages: number;
  totalElements: number;
  busy: boolean;
  onEdit: (income: IncomeResponse) => void;
  onDelete: (income: IncomeResponse) => void;
  onPageChange: (page: number) => void;
}

export function IncomeTable({
  incomes,
  page,
  totalPages,
  totalElements,
  busy,
  onEdit,
  onDelete,
  onPageChange,
}: IncomeTableProps) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="flex flex-wrap items-baseline justify-between gap-3 px-6 pb-4 pt-6">
        <h2 className="text-base font-bold text-navy-900">Your Income</h2>
        <span className="text-xs font-semibold text-navy-700/50">
          {totalElements} {totalElements === 1 ? 'result' : 'results'}
        </span>
      </div>

      {incomes.length === 0 ? (
        <p className="px-6 pb-8 text-sm text-navy-700/50">
          No income matches these filters.
        </p>
      ) : (
        <div className="overflow-x-auto">
          {/* Dimmed rather than replaced while refetching, so the table doesn't
              jump around every time a filter or page changes. */}
          <table
            className={`w-full min-w-[720px] border-collapse text-sm transition-opacity ${
              busy ? 'opacity-50' : 'opacity-100'
            }`}
          >
            <thead>
              <tr className="border-y border-sky-200/70 bg-sky-50/60 text-left">
                <th className="px-6 py-3 text-xs font-semibold text-navy-700/60">
                  Date
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-navy-700/60">
                  Source &amp; Category
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-navy-700/60">
                  Type
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-navy-700/60">
                  Amount
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-navy-700/60">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {incomes.map((income) => {
                const SourceIcon = SOURCE_ICONS[income.source];
                const label = sourceLabel(income.source);

                return (
                  <tr
                    key={income.id}
                    className="border-b border-sky-100 last:border-0 hover:bg-white/50"
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-navy-700/70">
                      {formatDate(income.incomeDate)}
                    </td>

                    <td className="px-4 py-4">
                      <p className="flex items-center gap-2 font-semibold text-navy-900">
                        <SourceIcon className="h-3.5 w-3.5 shrink-0 text-brand-green" />
                        {label}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {/* categoryName is resolved server-side; absent when no
                            category was linked to this entry. */}
                        {income.categoryName && (
                          <span className="flex items-center gap-1 rounded-pill bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-brand-blue">
                            <Tags className="h-2.5 w-2.5" />
                            {income.categoryName}
                          </span>
                        )}
                      </div>
                      {income.notes && (
                        <p className="mt-1 max-w-md truncate text-xs text-navy-700/45">
                          {income.notes}
                        </p>
                      )}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4">
                      {/* `recurring` is the response spelling of isRecurring. */}
                      {income.recurring ? (
                        <span className="inline-flex items-center gap-1.5 rounded-pill bg-lavender-100 px-2.5 py-1 text-[11px] font-semibold text-brand-purple">
                          <Repeat className="h-3 w-3" />
                          Recurring
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-navy-700/45">
                          One-off
                        </span>
                      )}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-right font-bold text-brand-green">
                      + {formatINRExact(income.amount)}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onEdit(income)}
                          aria-label={`Edit ${label} income of ${formatINRExact(
                            income.amount
                          )}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 bg-white/70 text-navy-700/70 hover:text-brand-blue"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(income)}
                          aria-label={`Delete ${label} income of ${formatINRExact(
                            income.amount
                          )}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-white/70 text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 border-t border-sky-100 px-6 py-4">
          <span className="text-xs font-semibold text-navy-700/50">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 0}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 bg-white/70 text-navy-700/70 disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages - 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 bg-white/70 text-navy-700/70 disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
