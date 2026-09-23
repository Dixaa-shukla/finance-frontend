import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { extractErrorMessage } from '@/api/axiosClient';
import {
  hasInvestmentErrors,
  validateInvestmentForm,
  type InvestmentFieldErrors,
} from '@/utils/investmentValidation';
import { todayISO } from '@/utils/format';
import {
  FIXED_RETURN_TYPES,
  INVESTMENT_TYPES,
  type InvestmentRequest,
} from '@/types/investment';

/**
 * Add / edit dialog for POST /investments and PUT /investments/{id}.
 *
 * ⚠️ PUT IS A FULL REPLACE, WHICH IS WHY EVERY FIELD IS ON THIS FORM.
 * toEntity() writes all ten columns from the request, so an omitted optional
 * field is stored as null — there is no partial update. The edit path therefore
 * seeds every value from the existing row.
 *
 * ⚠️ LEAVING "CURRENT VALUE" BLANK IS MEANINGFUL, NOT LAZY. Both write paths
 * substitute investedAmount when it is null, which records "no gain or loss yet".
 * Blanking it on an existing holding resets it to the invested figure, so the
 * edit path pre-fills it and the helper text says what blank does.
 *
 * ⚠️ purchaseDate CARRIES max=today (@PastOrPresent) BUT maturityDate CARRIES
 * NEITHER BOUND. A maturity date in the past is legal and simply means the
 * holding has matured — toResponse() sets `matured: true` for exactly that.
 */
interface InvestmentFormModalProps {
  title: string;
  submitLabel: string;
  editing: boolean;
  initialValues: InvestmentRequest;
  onClose: () => void;
  onSubmit: (values: InvestmentRequest) => Promise<void>;
}

function inputClasses(hasError: boolean) {
  return `w-full rounded-xl border bg-white/70 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-700/30 focus:bg-white ${
    hasError ? 'border-red-400' : 'border-sky-200'
  }`;
}

const labelClasses = 'mb-1.5 block text-xs font-semibold text-navy-700/70';

/** Blank input -> null, so an optional number is omitted rather than sent as 0. */
function toNumberOrNull(raw: string): number | null {
  return raw === '' ? null : Number(raw);
}

export function InvestmentFormModal({
  title,
  submitLabel,
  editing,
  initialValues,
  onClose,
  onSubmit,
}: InvestmentFormModalProps) {
  const [values, setValues] = useState<InvestmentRequest>(initialValues);
  const [errors, setErrors] = useState<InvestmentFieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Drives which optional fields are surfaced first, not which are allowed —
  // the backend accepts interestRate and maturityDate on any type.
  const fixedReturn = FIXED_RETURN_TYPES.includes(values.type);
  const unit =
    INVESTMENT_TYPES.find((item) => item.value === values.type)?.unit ?? 'units';

  function update<K extends keyof InvestmentRequest>(
    key: K,
    value: InvestmentRequest[K]
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const validationErrors = validateInvestmentForm(values);
    setErrors(validationErrors);
    if (hasInvestmentErrors(validationErrors)) return;

    setSubmitting(true);
    try {
      await onSubmit({
        ...values,
        name: values.name.trim(),
        notes: values.notes?.trim() ? values.notes.trim() : null,
      });
    } catch (err) {
      setSubmitError(
        extractErrorMessage(err, 'Something went wrong. Please try again.')
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="fixed inset-0 bg-navy-900/30 backdrop-blur-sm"
      />

      <form
        onSubmit={handleSubmit}
        noValidate
        className="glass-card relative z-10 my-auto w-full max-w-2xl p-6 sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-bold text-navy-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-navy-700/50 hover:bg-sky-100 hover:text-navy-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {editing && (
          <p className="mt-4 rounded-xl bg-sky-50 px-4 py-2.5 text-xs text-navy-700/70">
            Saving replaces the whole holding, so anything you clear is removed.
          </p>
        )}

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClasses} htmlFor="inv-type">
              Asset type
            </label>
            <select
              id="inv-type"
              value={values.type}
              onChange={(e) =>
                update('type', e.target.value as InvestmentRequest['type'])
              }
              className={inputClasses(false)}
            >
              {INVESTMENT_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClasses} htmlFor="inv-name">
              Name
            </label>
            <input
              id="inv-name"
              type="text"
              maxLength={150}
              value={values.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="e.g. HDFC Flexi Cap Fund"
              className={inputClasses(!!errors.name)}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label className={labelClasses} htmlFor="inv-invested">
              Invested amount (₹)
            </label>
            <input
              id="inv-invested"
              type="number"
              min="0.01"
              step="0.01"
              value={values.investedAmount ?? ''}
              onChange={(e) =>
                update('investedAmount', toNumberOrNull(e.target.value))
              }
              className={inputClasses(!!errors.investedAmount)}
            />
            {errors.investedAmount && (
              <p className="mt-1 text-xs text-red-600">
                {errors.investedAmount}
              </p>
            )}
          </div>

          <div>
            <label className={labelClasses} htmlFor="inv-current">
              Current value (₹)
            </label>
            <input
              id="inv-current"
              type="number"
              min="0"
              step="0.01"
              value={values.currentValue ?? ''}
              onChange={(e) =>
                update('currentValue', toNumberOrNull(e.target.value))
              }
              className={inputClasses(!!errors.currentValue)}
            />
            {errors.currentValue ? (
              <p className="mt-1 text-xs text-red-600">{errors.currentValue}</p>
            ) : (
              <p className="mt-1 text-xs text-navy-700/45">
                Leave blank to match the invested amount.
              </p>
            )}
          </div>

          <div>
            <label className={labelClasses} htmlFor="inv-quantity">
              Quantity ({unit}) — optional
            </label>
            <input
              id="inv-quantity"
              type="number"
              min="0"
              step="0.0001"
              value={values.quantity ?? ''}
              onChange={(e) =>
                update('quantity', toNumberOrNull(e.target.value))
              }
              className={inputClasses(!!errors.quantity)}
            />
            {errors.quantity && (
              <p className="mt-1 text-xs text-red-600">{errors.quantity}</p>
            )}
          </div>

          <div>
            <label className={labelClasses} htmlFor="inv-purchase">
              Purchase date
            </label>
            <input
              id="inv-purchase"
              type="date"
              max={todayISO()}
              value={values.purchaseDate}
              onChange={(e) => update('purchaseDate', e.target.value)}
              className={inputClasses(!!errors.purchaseDate)}
            />
            {errors.purchaseDate && (
              <p className="mt-1 text-xs text-red-600">{errors.purchaseDate}</p>
            )}
          </div>

          <div>
            <label className={labelClasses} htmlFor="inv-rate">
              Interest rate (% p.a.){fixedReturn ? '' : ' — optional'}
            </label>
            <input
              id="inv-rate"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={values.interestRate ?? ''}
              onChange={(e) =>
                update('interestRate', toNumberOrNull(e.target.value))
              }
              className={inputClasses(!!errors.interestRate)}
            />
            {errors.interestRate && (
              <p className="mt-1 text-xs text-red-600">{errors.interestRate}</p>
            )}
          </div>

          <div>
            <label className={labelClasses} htmlFor="inv-maturity">
              Maturity date{fixedReturn ? '' : ' — optional'}
            </label>
            <input
              id="inv-maturity"
              type="date"
              value={values.maturityDate ?? ''}
              onChange={(e) =>
                update('maturityDate', e.target.value || null)
              }
              className={inputClasses(!!errors.maturityDate)}
            />
            {errors.maturityDate && (
              <p className="mt-1 text-xs text-red-600">{errors.maturityDate}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className={labelClasses} htmlFor="inv-notes">
              Notes — optional
            </label>
            <textarea
              id="inv-notes"
              rows={2}
              maxLength={500}
              value={values.notes ?? ''}
              onChange={(e) => update('notes', e.target.value)}
              placeholder="Broker, folio number, why you bought it…"
              className={inputClasses(!!errors.notes)}
            />
            {errors.notes && (
              <p className="mt-1 text-xs text-red-600">{errors.notes}</p>
            )}
          </div>
        </div>

        {submitError && (
          <p className="mt-5 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">
            {submitError}
          </p>
        )}

        <div className="mt-7 flex items-center gap-3">
          <Button type="submit" loading={submitting}>
            {submitLabel}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
