import { CheckCircle2, FileText, Info, X } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/components/common/Button';
import { formatDate, formatINRExact } from '@/utils/format';
import type { ReceiptUploadResponse } from '@/types/file';

/**
 * What the server actually made of the receipt.
 *
 * ⚠️ THIS DIALOG EXISTS BECAUSE 201 IS NOT THE WHOLE STORY. uploadAndProcessReceipt
 * only needs the Cloudinary step to succeed — OCR can return nothing and the AI
 * can decline to guess, and the response is still 201. So the outcome is reported
 * from `autoSaved`, and the raw OCR text is shown when extraction came up empty so
 * the user can copy the figures across by hand.
 */
export function ReceiptResultModal({
  result,
  onClose,
}: {
  result: ReceiptUploadResponse;
  onClose: () => void;
}) {
  const rows = [
    { label: 'Merchant', value: result.extractedMerchant },
    {
      label: 'Amount',
      value:
        result.extractedAmount !== null
          ? formatINRExact(result.extractedAmount)
          : null,
    },
    {
      label: 'Date',
      value: result.extractedDate ? formatDate(result.extractedDate) : null,
    },
    { label: 'Category', value: result.extractedCategory },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="fixed inset-0 bg-navy-900/30 backdrop-blur-sm"
      />

      <div className="glass-card relative z-10 my-auto w-full max-w-lg p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-soft ${
                result.autoSaved
                  ? 'bg-gradient-to-br from-brand-green to-brand-cyan'
                  : 'bg-gradient-to-br from-amber-400 to-amber-500'
              }`}
            >
              {result.autoSaved ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <Info className="h-5 w-5" />
              )}
            </span>
            <div>
              <h2 className="text-lg font-bold text-navy-900">
                {result.autoSaved ? 'Expense created' : 'Receipt saved'}
              </h2>
              <p className="mt-0.5 text-xs text-navy-700/55">
                {result.autoSaved
                  ? 'Nova read the receipt and added the expense for you. Check the payment method — it was set to "Other".'
                  : 'The image is stored, but Nova could not read a merchant and amount confidently enough to create an expense. Add it manually using the text below.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-navy-700/50 hover:bg-sky-100 hover:text-navy-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Rendered whenever anything was extracted, saved or not. */}
        {rows.some((row) => row.value) && (
          <div className="mt-5 space-y-1.5 rounded-xl bg-sky-50/70 px-4 py-3 text-xs">
            {rows.map((row) => (
              <p
                key={row.label}
                className="flex items-baseline justify-between gap-3"
              >
                <span className="text-navy-700/55">{row.label}</span>
                <span
                  className={
                    row.value
                      ? 'font-semibold text-navy-900'
                      : 'text-navy-700/35'
                  }
                >
                  {row.value ?? 'not found'}
                </span>
              </p>
            ))}
          </div>
        )}

        {/* Only useful when the AI came up short — otherwise it is just noise. */}
        {!result.autoSaved && result.ocrRawText && (
          <div className="mt-4">
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-navy-700/70">
              <FileText className="h-3.5 w-3.5" />
              Text read from the image
            </p>
            <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-xl border border-sky-200 bg-white/70 p-3 text-[11px] leading-relaxed text-navy-800">
              {result.ocrRawText}
            </pre>
          </div>
        )}

        {!result.autoSaved && !result.ocrRawText && (
          <p className="mt-4 rounded-xl bg-amber-50 px-4 py-2.5 text-xs text-amber-700">
            No text could be read from this image at all. A sharper, straight-on
            photo in better light usually fixes it.
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {result.autoSaved ? (
            <Link to="/expenses">
              <Button>View Expense</Button>
            </Link>
          ) : (
            <Link to="/expenses">
              <Button>Add It Manually</Button>
            </Link>
          )}
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
