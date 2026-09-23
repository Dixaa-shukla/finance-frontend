import { ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate, formatINRExact } from '@/utils/format';
import { PAYMENT_METHODS } from '@/types/expense';
import type { TransactionResponse } from '@/types/transaction';

/**
 * The merged ledger.
 *
 * ⚠️ NO EDIT OR DELETE BUTTONS, AND THAT IS NOT AN OMISSION. TransactionController
 * exposes three GET routes and nothing else, because a "transaction" is a view
 * over an Expense or an Income row — there is no table to write to. The source
 * chip on each row (`Expense #12`) is the pointer back to the module that owns it.
 *
 * ⚠️ KEYED ON `${type}-${sourceId}`. TransactionResponse has no id, and an expense
 * and an income can easily share the same sourceId, so sourceId alone would give
 * React duplicate keys the moment both sides of the merge are shown.
 */

/** paymentMethod arrives as the raw enum name; reuse Module 3's label list. */
function methodLabel(value: string): string {
  const match = PAYMENT_METHODS.find((method) => method.value === value);
  return match ? match.label : value;
}

interface TransactionTableProps {
  rows: TransactionResponse[];
  heading: string;
  note?: string;
  emptyText: string;
  page: number;
  totalPages: number;
  totalElements: number;
  busy: boolean;
  onPageChange: (page: number) => void;
}

export function TransactionTable({
  rows,
  heading,
  note,
  emptyText,
  page,
  totalPages,
  totalElements,
  busy,
  onPageChange,
}: TransactionTableProps) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="flex flex-wrap items-baseline justify-between gap-3 px-6 pb-4 pt-6">
        <div>
          <h2 className="text-base font-bold text-navy-900">{heading}</h2>
          {note && <p className="mt-1 text-xs text-navy-700/55">{note}</p>}
        </div>
        <span className="text-xs font-semibold text-navy-700/50">
          {totalElements} {totalElements === 1 ? 'result' : 'results'}
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="px-6 pb-8 text-sm text-navy-700/50">{emptyText}</p>
      ) : (
        <div className="overflow-x-auto">
          {/* Dimmed rather than replaced while refetching, so the table doesn't
              jump around every time a filter, sort or page changes. */}
          <table
            className={`w-full min-w-[820px] border-collapse text-sm transition-opacity ${
              busy ? 'opacity-50' : 'opacity-100'
            }`}
          >
            <thead>
              <tr className="border-y border-sky-200/70 bg-sky-50/60 text-left">
                <th className="px-6 py-3 text-xs font-semibold text-navy-700/60">
                  Date
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-navy-700/60">
                  Description &amp; Category
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-navy-700/60">
                  Type
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-navy-700/60">
                  Payment
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-navy-700/60">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>{rows.map((row) => renderRow(row))}</tbody>
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

/**
 * One ledger row.
 *
 * ⚠️ THE SIGN IS PRINTED, THE NUMBER IS NOT NEGATIVE. `amount` is always positive
 * and `signedAmount` carries the direction; formatting signedAmount directly
 * would render "-₹1,200.00" with the minus inside the currency string and the
 * column would no longer line up. So: explicit + / − prefix, positive amount.
 */
function renderRow(row: TransactionResponse) {
  const isIncome = row.type === 'INCOME';

  return (
    <tr
      key={`${row.type}-${row.sourceId}`}
      className="border-b border-sky-100 last:border-0 hover:bg-white/50"
    >
      <td className="whitespace-nowrap px-6 py-4 text-navy-700/70">
        {formatDate(row.transactionDate)}
      </td>

      <td className="px-4 py-4">
        {/*
          description is the merchant for an expense and the source label for
          income, and the merchant is optional — so fall back to the category
          rather than rendering an empty cell.
        */}
        <p className="font-semibold text-navy-900">
          {row.description || row.category}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className="rounded-pill bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-brand-blue">
            {row.category}
          </span>
          {/* The pointer back to the row that actually owns this record. */}
          <span className="rounded-pill bg-white/70 px-2 py-0.5 text-[11px] font-medium text-navy-700/45">
            {isIncome ? 'Income' : 'Expense'} #{row.sourceId}
          </span>
        </div>
        {row.notes && (
          <p className="mt-1 max-w-md truncate text-xs text-navy-700/45">
            {row.notes}
          </p>
        )}
      </td>

      <td className="whitespace-nowrap px-4 py-4">
        <span
          className={`inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-[11px] font-semibold ${
            isIncome
              ? 'bg-brand-green/10 text-brand-green'
              : 'bg-red-50 text-red-500'
          }`}
        >
          {isIncome ? (
            <ArrowDownLeft className="h-3 w-3" />
          ) : (
            <ArrowUpRight className="h-3 w-3" />
          )}
          {isIncome ? 'Income' : 'Expense'}
        </span>
      </td>

      {/* Null for every income row — fromIncome() never sets it. */}
      <td className="whitespace-nowrap px-4 py-4 text-navy-700/70">
        {row.paymentMethod ? methodLabel(row.paymentMethod) : '—'}
      </td>

      <td
        className={`whitespace-nowrap px-6 py-4 text-right font-bold ${
          isIncome ? 'text-brand-green' : 'text-navy-900'
        }`}
      >
        {isIncome ? '+' : '−'}
        {formatINRExact(row.amount)}
      </td>

    </tr>
  );
}
