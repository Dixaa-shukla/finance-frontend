import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Module 1 — Authentication & Security.
 *
 * Label + input + inline error, with a leading icon and an optional password
 * visibility toggle.
 *
 * ⚠️ THE CLASSES BELOW ARE COPIED FROM components/profile/ProfileEditForm.tsx
 * ON PURPOSE (rounded-xl, bg-white/70, border-sky-200, focus:bg-white,
 * border-red-400 on error). Auth inputs and dashboard inputs must be visually
 * identical — if you restyle one, restyle both.
 */

interface AuthInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  /** A lucide icon element, e.g. <Mail className="h-4 w-4" />. */
  icon?: ReactNode;
  error?: string;
  /** Renders the eye / eye-off toggle and flips type between password and text. */
  showPasswordToggle?: boolean;
  /** e.g. the strength meter under the Register password field. */
  hint?: ReactNode;
}

export function AuthInput({
  label,
  icon,
  error,
  showPasswordToggle = false,
  hint,
  type = 'text',
  className = '',
  ...rest
}: AuthInputProps) {
  // useId keeps label/input wired together even when the same field name appears
  // on two screens at once.
  const id = useId();
  const [revealed, setRevealed] = useState(false);

  const effectiveType = showPasswordToggle && revealed ? 'text' : type;

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-semibold text-navy-700/70"
      >
        {label}
      </label>

      <div className="relative">
        {icon && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-700/40"
          >
            {icon}
          </span>
        )}

        <input
          id={id}
          type={effectiveType}
          // aria-invalid + aria-describedby are what let a screen reader announce
          // the error text that sighted users read below the field.
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full rounded-xl border bg-white/70 py-2.5 text-sm text-navy-900 transition-colors placeholder:text-navy-700/30 focus:bg-white ${
            icon ? 'pl-10' : 'pl-3.5'
          } ${showPasswordToggle ? 'pr-11' : 'pr-3.5'} ${
            error ? 'border-red-400' : 'border-sky-200'
          }`}
          {...rest}
        />

        {showPasswordToggle && (
          <button
            type="button"
            // type="button" is essential — without it this submits the form.
            onClick={() => setRevealed((prev) => !prev)}
            aria-label={revealed ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-navy-700/40 transition-colors hover:text-navy-700"
          >
            {revealed ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-500">
          {error}
        </p>
      ) : (
        hint
      )}
    </div>
  );
}
