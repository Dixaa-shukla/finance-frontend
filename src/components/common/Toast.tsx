import { useEffect } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

export interface ToastState {
  type: 'success' | 'error';
  message: string;
}

interface ToastProps {
  toast: ToastState | null;
  onDismiss: () => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';

  return (
    <div
      role="status"
      className={`glass-card fixed bottom-6 right-6 z-50 flex items-center gap-3 border-l-4 px-5 py-4 shadow-glass animate-[fadeIn_0.2s_ease-out] ${
        isSuccess ? 'border-l-brand-green' : 'border-l-red-500'
      }`}
    >
      {isSuccess ? (
        <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-green" />
      ) : (
        <XCircle className="h-5 w-5 shrink-0 text-red-500" />
      )}
      <p className="text-sm font-medium text-navy-800">{toast.message}</p>
      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="ml-2 text-navy-700/50 hover:text-navy-800"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}