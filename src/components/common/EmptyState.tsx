import type { ReactNode } from 'react';
import { UserRoundPlus, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/common/Button';

interface EmptyStateProps {
  variant?: 'not-found' | 'error';
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
}

export function EmptyState({
  variant = 'not-found',
  title,
  description,
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) {
  const Icon = icon ?? (variant === 'error' ? (
    <AlertTriangle className="h-7 w-7 text-brand-purple" />
  ) : (
    <UserRoundPlus className="h-7 w-7 text-brand-blue" />
  ));

  return (
    <div className="glass-card flex flex-col items-center gap-4 px-8 py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100">
        {Icon}
      </div>
      <div>
        <h3 className="text-lg font-bold text-navy-900">{title}</h3>
        <p className="mt-1 max-w-sm text-sm text-navy-700/70">{description}</p>
      </div>
      {actionLabel && onAction && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}