import type { ReactNode } from 'react';

interface ProfileFieldProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
}

export function ProfileField({ label, value, icon }: ProfileFieldProps) {
  return (
    <div className="flex items-start gap-3">
      {icon && (
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-brand-blue">
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-navy-700/50">
          {label}
        </p>
        <p className="mt-0.5 truncate text-[15px] font-semibold text-navy-900">
          {value ?? <span className="font-normal text-navy-700/40">Not set</span>}
        </p>
      </div>
    </div>
  );
}