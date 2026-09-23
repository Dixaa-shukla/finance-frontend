import {
  CalendarCheck,
  Pencil,
  Percent,
  TrendingDown,
  TrendingUp,
  Trash2,
} from 'lucide-react';
import { formatDate, formatINRExact } from '@/utils/format';
import {
  INVESTMENT_TYPES,
  INVESTMENT_TYPE_LABELS,
  type InvestmentResponse,
  type InvestmentType,
} from '@/types/investment';

/**
 * One card per holding.
 *
 * ⚠️ gainLossAmount, gainLossPercent AND matured ALL ARRIVE FROM THE SERVER.
 * toResponse() computes them on every read — matured against LocalDate.now() —
 * so the card formats them and never recomputes. currentValue is never null here
 * either: both write paths substitute investedAmount when it is omitted.
 *
 * ⚠️ "NO GAIN YET" IS NOT THE SAME AS "0% RETURN". When the user has never
 * supplied a current value the server stores currentValue = investedAmount, which
 * is a genuine zero difference. The card says "not revalued yet" for that case
 * rather than showing a flat 0.00%, because the two mean different things to
 * someone deciding whether to update the figure.
 */
interface InvestmentGridProps {
  investments: InvestmentResponse[];
  busy: boolean;
  onEdit: (investment: InvestmentResponse) => void;
  onDelete: (investment: InvestmentResponse) => void;
}

function unitFor(type: InvestmentType): string {
  const match = INVESTMENT_TYPES.find((item) => item.value === type);
  return match ? match.unit : 'units';
}

export function InvestmentGrid({
  investments,
  busy,
  onEdit,
  onDelete,
}: InvestmentGridProps) {
  if (investments.length === 0) {
    return (
      <div className="glass-card p-10 text-center">
        <p className="text-sm font-semibold text-navy-900">
          No holdings match this filter
        </p>
        <p className="mt-1 text-xs text-navy-700/50">
          Try another asset type, or clear the search box.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {investments.map((item) => renderCard(item, busy, onEdit, onDelete))}
    </div>
  );
}

function renderCard(
  item: InvestmentResponse,
  busy: boolean,
  onEdit: (investment: InvestmentResponse) => void,
  onDelete: (investment: InvestmentResponse) => void
) {
  const up = item.gainLossAmount > 0;
  const down = item.gainLossAmount < 0;
  const neverRevalued = item.gainLossAmount === 0;

  return (
    <div key={item.id} className="glass-card flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-navy-900">{item.name}</p>
          <p className="mt-0.5 text-xs text-navy-700/50">
            {INVESTMENT_TYPE_LABELS[item.type]} · bought{' '}
            {formatDate(item.purchaseDate)}
          </p>
        </div>
        {/* Server-computed: maturityDate is set and is today or earlier. */}
        {item.matured && (
          <span className="shrink-0 rounded-pill bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
            Matured
          </span>
        )}
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs text-navy-700/50">Current value</p>
          <p className="text-xl font-extrabold tracking-tight text-navy-900">
            {formatINRExact(item.currentValue)}
          </p>
        </div>
        <div
          className={`flex items-center gap-1 rounded-pill px-2.5 py-1 text-xs font-bold ${
            up
              ? 'bg-emerald-50 text-brand-green'
              : down
                ? 'bg-red-50 text-red-600'
                : 'bg-white/70 text-navy-700/50'
          }`}
        >
          {up ? (
            <TrendingUp className="h-3.5 w-3.5" />
          ) : down ? (
            <TrendingDown className="h-3.5 w-3.5" />
          ) : null}
          {neverRevalued
            ? 'Not revalued yet'
            : `${up ? '+' : '−'}${Math.abs(item.gainLossPercent).toFixed(2)}%`}
        </div>
      </div>

      <div className="mt-3 space-y-1.5 rounded-xl bg-sky-50/70 px-3 py-2.5 text-xs">
        <p className="flex items-baseline justify-between gap-3">
          <span className="text-navy-700/55">Invested</span>
          <span className="font-semibold text-navy-900">
            {formatINRExact(item.investedAmount)}
          </span>
        </p>
        <p className="flex items-baseline justify-between gap-3">
          <span className="text-navy-700/55">
            {up ? 'Gain' : down ? 'Loss' : 'Change'}
          </span>
          <span
            className={`font-semibold ${
              up ? 'text-brand-green' : down ? 'text-red-500' : 'text-navy-700/45'
            }`}
          >
            {up ? '+' : down ? '−' : ''}
            {formatINRExact(Math.abs(item.gainLossAmount))}
          </span>
        </p>
        {/*
          Both optional on the request. quantity may legitimately be 0 —
          @DecimalMin is "0.0", not "0.01" — so the check is against null, not
          falsiness, or a zero-unit holding would silently lose its row.
        */}
        {item.quantity !== null && (
          <p className="flex items-baseline justify-between gap-3">
            <span className="text-navy-700/55">Quantity</span>
            <span className="font-semibold text-navy-900">
              {item.quantity} {unitFor(item.type)}
            </span>
          </p>
        )}
        {item.interestRate !== null && (
          <p className="flex items-baseline justify-between gap-3">
            <span className="flex items-center gap-1 text-navy-700/55">
              <Percent className="h-3 w-3" />
              Interest rate
            </span>
            <span className="font-semibold text-navy-900">
              {item.interestRate}% p.a.
            </span>
          </p>
        )}
        {item.maturityDate && (
          <p className="flex items-baseline justify-between gap-3">
            <span className="flex items-center gap-1 text-navy-700/55">
              <CalendarCheck className="h-3 w-3" />
              {item.matured ? 'Matured on' : 'Matures on'}
            </span>
            <span className="font-semibold text-navy-900">
              {formatDate(item.maturityDate)}
            </span>
          </p>
        )}
      </div>

      {item.notes && (
        <p className="mt-3 line-clamp-2 text-xs text-navy-700/55">{item.notes}</p>
      )}

      <div className="mt-auto flex flex-wrap items-center justify-end gap-2 border-t border-sky-100 pt-3">
        <button
          type="button"
          onClick={() => onEdit(item)}
          disabled={busy}
          aria-label={`Edit ${item.name}`}
          className="inline-flex items-center gap-1.5 rounded-pill border border-sky-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-navy-700 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Pencil className="h-3.5 w-3.5" />
          {/* The controller names this as the route's main purpose. */}
          {neverRevalued ? 'Update value' : 'Edit'}
        </button>
        <button
          type="button"
          onClick={() => onDelete(item)}
          disabled={busy}
          aria-label={`Delete ${item.name}`}
          className="inline-flex items-center gap-1.5 rounded-pill border border-red-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>
      </div>

    </div>
  );
}
