import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: ReactNode;
  loading?: boolean;
  children: ReactNode;
}

/**
 * Variant styling only — the props, sizes and behaviour are unchanged.
 *
 * `primary` runs purple → light blue with a coloured glow underneath, which is
 * the button treatment in the reference design and the same gradient the sidebar
 * uses for its active pill and its "Chat with Nova AI" card. A flat blue fill is
 * what made the old buttons read as a generic template.
 */
const variantClasses: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-brand-purple via-[#5b7ce8] to-brand-sky text-white shadow-glow hover:-translate-y-0.5 active:translate-y-0',
  secondary:
    'bg-white/75 text-navy-800 border border-sky-200 shadow-soft hover:bg-white hover:shadow-lift',
  ghost: 'bg-transparent text-navy-700 hover:bg-sky-100 hover:text-brand-blue',
  danger:
    'bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-soft hover:-translate-y-0.5 active:translate-y-0',
};

export function Button({
  variant = 'primary',
  icon,
  loading,
  children,
  className = '',
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-pill px-5 py-2.5 text-sm font-bold transition-all duration-200 disabled:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white" />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}