import { ExternalLink, Image, Receipt, Trash2 } from 'lucide-react';
import { formatDate } from '@/utils/format';
import {
  STORED_FILE_TYPE_LABELS,
  formatFileSize,
  type StoredFileResponse,
} from '@/types/file';

/**
 * Every file this user has uploaded, newest first — the repository already
 * returns them ordered by uploadedAt desc, so the order is not re-derived.
 *
 * ⚠️ NO IMAGE IS RENDERED INLINE. Both file types are photos, and profile
 * photos are out of scope for this project, so each row links out to the stored
 * Cloudinary URL instead of embedding it.
 */
interface DocumentListProps {
  files: StoredFileResponse[];
  busy: boolean;
  onDelete: (file: StoredFileResponse) => void;
}

export function DocumentList({ files, busy, onDelete }: DocumentListProps) {
  if (files.length === 0) {
    return (
      <div className="glass-card p-10 text-center">
        <p className="text-sm font-semibold text-navy-900">
          No files match this filter
        </p>
        <p className="mt-1 text-xs text-navy-700/50">
          Try the other tab, or upload a receipt to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card divide-y divide-sky-100 p-2">
      {files.map((file) => {
        const isReceipt = file.fileType === 'RECEIPT';
        // relatedEntityType is set to "EXPENSE" only when autoSaved was true.
        const linkedExpense =
          file.relatedEntityType === 'EXPENSE' && file.relatedEntityId !== null;

        return (
          <div
            key={file.id}
            className="flex flex-wrap items-center gap-3 px-3 py-3"
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                isReceipt
                  ? 'bg-lavender-100 text-brand-purple'
                  : 'bg-sky-100 text-brand-blue'
              }`}
            >
              {isReceipt ? (
                <Receipt className="h-4 w-4" />
              ) : (
                <Image className="h-4 w-4" />
              )}
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-navy-900">
                {file.originalFilename ?? `File #${file.id}`}
              </p>
              <p className="mt-0.5 text-[11px] text-navy-700/50">
                {STORED_FILE_TYPE_LABELS[file.fileType]} ·{' '}
                {formatFileSize(file.fileSizeBytes)} ·{' '}
                {formatDate(file.uploadedAt.slice(0, 10))}
              </p>
            </div>

            {linkedExpense && (
              <span className="shrink-0 rounded-pill bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-brand-green">
                Expense #{file.relatedEntityId}
              </span>
            )}

            <div className="flex shrink-0 items-center gap-2">
              <a
                href={file.storedUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-pill border border-sky-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-navy-700 transition-colors hover:bg-white"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open
              </a>
              <button
                type="button"
                onClick={() => onDelete(file)}
                disabled={busy}
                aria-label={`Delete ${file.originalFilename ?? `file ${file.id}`}`}
                className="inline-flex items-center gap-1.5 rounded-pill border border-red-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
