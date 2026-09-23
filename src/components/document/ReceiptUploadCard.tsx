import { useRef, useState } from 'react';
import { ScanLine, Upload, X } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { checkUploadFile, formatFileSize } from '@/types/file';

/**
 * Receipt upload. Only receipts are offered here — the other upload route is for
 * profile images, which this project deliberately does not use.
 *
 * ⚠️ THE CLIENT CHECKS MIRROR validateImage(), THEY DO NOT REPLACE IT. Same 5 MB
 * ceiling and same three content types, so a file that would be rejected server
 * side is caught before it is sent, not so the server check can be skipped.
 */
interface ReceiptUploadCardProps {
  busy: boolean;
  onUpload: (file: File) => Promise<void>;
}

export function ReceiptUploadCard({ busy, onUpload }: ReceiptUploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  function pick(next: File | null) {
    setError(null);
    if (!next) {
      setFile(null);
      return;
    }
    const problem = checkUploadFile(next);
    if (problem) {
      setFile(null);
      setError(problem);
      return;
    }
    setFile(next);
  }

  function clear() {
    setFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function handleUpload() {
    if (!file) return;
    await onUpload(file);
    clear();
  }

  return (
    <div className="glass-card p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-blue to-brand-purple text-white shadow-soft">
          <ScanLine className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-sm font-bold text-navy-900">Scan a Receipt</h2>
          <p className="mt-0.5 text-xs text-navy-700/55">
            Nova reads the photo, pulls out the merchant, amount and date, and
            creates the expense for you when it is confident.
          </p>
        </div>
      </div>

      <label
        htmlFor="receipt-input"
        className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-card border-2 border-dashed border-sky-200 bg-sky-50/50 px-4 py-7 text-center transition-colors hover:border-brand-blue/50 hover:bg-sky-50"
      >
        <Upload className="h-6 w-6 text-brand-blue" />
        <span className="mt-2 text-sm font-semibold text-navy-800">
          Choose a receipt photo
        </span>
        <span className="mt-1 text-xs text-navy-700/50">
          JPEG, PNG or WebP · up to 5 MB
        </span>
      </label>
      <input
        id="receipt-input"
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0] ?? null)}
      />

      {error && (
        <p className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">
          {error}
        </p>
      )}

      {file && (
        <div className="mt-3 flex items-center gap-3 rounded-xl bg-white/70 px-3.5 py-2.5">
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-bold text-navy-900">
              {file.name}
            </span>
            <span className="block text-[11px] text-navy-700/50">
              {formatFileSize(file.size)}
            </span>
          </span>
          <button
            type="button"
            onClick={clear}
            disabled={busy}
            aria-label="Remove selected file"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-navy-700/50 hover:bg-sky-100 disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="mt-4">
        <Button
          onClick={handleUpload}
          disabled={!file}
          loading={busy}
          icon={<ScanLine className="h-4 w-4" />}
        >
          Upload &amp; Read
        </Button>
        {busy && (
          <p className="mt-2 text-xs text-navy-700/50">
            Uploading, running OCR, then asking the AI — this can take a few
            seconds.
          </p>
        )}
      </div>
    </div>
  );
}
