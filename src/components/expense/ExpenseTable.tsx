import {
  Banknote,
  Building2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  MapPin,
  Pencil,
  Receipt,
  Smartphone,
  Trash2,
  Wallet,
} from 'lucide-react';
import { formatDate, formatINRExact } from '@/utils/format';
import { PAYMENT_METHODS, type ExpenseResponse } from '@/types/expense';

/** Icon per payment method, so a row is scannable without reading the label. */
const METHOD_ICONS = {
  CASH: Banknote,
  CREDIT_CARD: CreditCard,
  DEBIT_CARD: CreditCard,
  UPI: Smartphone,
  NET_BANKING: Building2,
  WALLET: Wallet,
  OTHER: Receipt,
};

function methodLabel(value: string): string {
  const match = PAYMENT_METHODS.find((method) => method.value === value);
  return match ? match.label : value;
}

interface ExpenseTableProps {
  expenses: ExpenseResponse[];
  page: number;
  totalPages: number;
  totalElements: number;
  busy: boolean;
  onEdit: (expense: ExpenseResponse) => void;
  onDelete: (expense: ExpenseResponse) => void;
  onPageChange: (page: number) => void;
}

export function ExpenseTable({
  expenses,
  page,
  totalPages,
  totalElements,
  busy,
  onEdit,
  onDelete,
  onPageChange,
}: ExpenseTableProps) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="flex flex-wrap items-baseline justify-between gap-3 px-6 pb-4 pt-6">
        <h2 className="text-base font-bold text-navy-900">Your Expenses</h2>
        <span className="text-xs font-semibold text-navy-700/50">
          {totalElements} {totalElements === 1 ? 'result' : 'results'}
        </span>
      </div>

      {expenses.length === 0 ? (
        <p className="px-6 pb-8 text-sm text-navy-700/50">
          No expenses match these filters.
        </p>
      ) : (
        <div className="overflow-x-auto">
          {/* Dimmed rather than replaced while refetching, so the table doesn't
              jump around every time a filter or page changes. */}
          <table
            className={`w-full min-w-[760px] border-collapse text-sm transition-opacity ${
              busy ? 'opacity-50' : 'opacity-100'
            }`}
          >
            <thead>
              <tr className="border-y border-sky-200/70 bg-sky-50/60 text-left">
                <th className="px-6 py-3 text-xs font-semibold text-navy-700/60">
                  Date
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-navy-700/60">
                  Merchant &amp; Category
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-navy-700/60">
                  Payment
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
              {expenses.map((expense) => {
                const MethodIcon = METHOD_ICONS[expense.paymentMethod];

                return (
                  <tr
                    key={expense.id}
                    className="border-b border-sky-100 last:border-0 hover:bg-white/50"
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-navy-700/70">
                      {formatDate(expense.expenseDate)}
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-semibold text-navy-900">
                        {expense.merchant || expense.category}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="rounded-pill bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-brand-blue">
                          {expense.category}
                        </span>
                        {expense.tags?.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-pill bg-lavender-100 px-2 py-0.5 text-[11px] font-medium text-brand-purple"
                          >
                            #{tag}
                          </span>
                        ))}
                        {expense.location && (
                          <span className="flex items-center gap-1 text-[11px] text-navy-700/45">
                            <MapPin className="h-3 w-3" />
                            {expense.location}
                          </span>
                        )}
                      </div>
                      {expense.notes && (
                        <p className="mt-1 max-w-md truncate text-xs text-navy-700/45">
                          {expense.notes}
                        </p>
                      )}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4">
                      <span className="inline-flex items-center gap-1.5 text-navy-700/70">
                        <MethodIcon className="h-3.5 w-3.5 text-brand-blue" />
                        {methodLabel(expense.paymentMethod)}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-right font-bold text-navy-900">
                      {formatINRExact(expense.amount)}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onEdit(expense)}
                          aria-label={`Edit expense at ${
                            expense.merchant || expense.category
                          }`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 bg-white/70 text-navy-700/70 hover:text-brand-blue"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(expense)}
                          aria-label={`Delete expense at ${
                            expense.merchant || expense.category
                          }`}
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
