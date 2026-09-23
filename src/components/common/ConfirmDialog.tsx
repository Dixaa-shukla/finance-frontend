import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/common/Button';

/**
 * A small yes/no dialog for destructive actions, used before DELETE calls.
 * Deliberately generic so other modules can reuse it.
 */
interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Delete',
  loading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cancel"
        onClick={onCancel}
        className="fixed inset-0 bg-navy-900/30 backdrop-blur-sm"
      />

      <div
        role="alertdialog"
        aria-modal="true"
        className="glass-card relative z-10 w-full max-w-sm p-6 text-center"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50">
          <AlertTriangle className="h-6 w-6 text-red-500" />
        </div>
        <h2 className="mt-4 text-base font-bold text-navy-900">{title}</h2>
        <p className="mt-1.5 text-sm text-navy-700/60">{message}</p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <Button variant="danger" loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
