import { useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { extractErrorMessage } from '@/api/axiosClient';
import {
  hasCategoryErrors,
  validateCategoryForm,
  type CategoryFieldErrors,
} from '@/utils/categoryValidation';
import {
  CATEGORY_TYPES,
  COLOR_PRESETS,
  ICON_SUGGESTIONS,
  type CategoryRequest,
} from '@/types/category';

/**
 * Add / edit dialog for the category write routes.
 *
 * Every input maps to a field on CategoryRequest, and the maxLength values are the
 * @Size limits from that DTO (name 50, icon 50), so the browser stops the user
 * before the server has to reject them. Validation still runs server-side too.
 *
 * ⚠️ `asDefault` IS NOT A FIELD ON CategoryRequest — IT PICKS THE ENDPOINT.
 * The backend decides isDefault and userId from WHICH route was called:
 *
 *     POST /categories/defaults            -> isDefault = true,  userId = null
 *     POST /categories/custom/user/{id}    -> isDefault = false, userId = id
 *
 * The first is @PreAuthorize("hasRole('ADMIN')"), so the checkbox that sets this
 * only renders when `allowDefault` is true — the page passes useAuth().isAdmin.
 * It is also create-only: there is no route that converts an existing category
 * from custom to default or back.
 */
interface CategoryFormModalProps {
  title: string;
  submitLabel: string;
  initialValues: CategoryRequest;
  /** True only for an admin creating a new category. */
  allowDefault: boolean;
  onClose: () => void;
  onSubmit: (values: CategoryRequest, asDefault: boolean) => Promise<void>;
}

function inputClasses(hasError: boolean) {
  return `w-full rounded-xl border bg-white/70 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-700/30 focus:bg-white ${
    hasError ? 'border-red-400' : 'border-sky-200'
  }`;
}

const labelClasses = 'mb-1.5 block text-xs font-semibold text-navy-700/70';

export function CategoryFormModal({
  title,
  submitLabel,
  initialValues,
  allowDefault,
  onClose,
  onSubmit,
}: CategoryFormModalProps) {
  const [values, setValues] = useState<CategoryRequest>(initialValues);
  const [asDefault, setAsDefault] = useState(false);
  const [errors, setErrors] = useState<CategoryFieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function update<K extends keyof CategoryRequest>(
    key: K,
    value: CategoryRequest[K]
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const validationErrors = validateCategoryForm(values);
    setErrors(validationErrors);
    if (hasCategoryErrors(validationErrors)) return;

    setSubmitting(true);
    try {
      // Trim the name because @NotBlank passes on " x " but the stored value
      // would keep the padding, and send null rather than "" for the two
      // optional fields so the row reads as "not set" instead of "set to empty".
      await onSubmit(
        {
          ...values,
          name: values.name.trim(),
          icon: values.icon && values.icon.trim() ? values.icon.trim() : null,
          colorHex: values.colorHex ? values.colorHex : null,
        },
        asDefault
      );
    } catch (err) {
      // ⚠️ NOT err.message. An AxiosError's own message is the useless
      // "Request failed with status code 409"; the readable one the backend sent
      // ("A category named 'food' already exists for type EXPENSE") lives in the
      // response body. This error stays on screen after the toast auto-dismisses,
      // so it has to be the informative one.
      setSubmitError(
        extractErrorMessage(err, 'Something went wrong. Please try again.')
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6">
      {/* A real button, so the overlay can be dismissed by keyboard too. */}
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

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="category-name" className={labelClasses}>
              Name *
            </label>
            <input
              id="category-name"
              type="text"
              maxLength={50}
              value={values.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="Groceries"
              className={inputClasses(!!errors.name)}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="category-type" className={labelClasses}>
              Type *
            </label>
            {/* A fixed backend enum, so a dropdown is the only valid control. */}
            <select
              id="category-type"
              value={values.type}
              onChange={(e) =>
                update('type', e.target.value as CategoryRequest['type'])
              }
              className={inputClasses(!!errors.type)}
            >
              {CATEGORY_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-navy-700/45">
              Decides whether this appears when logging an expense or an income.
            </p>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="category-icon" className={labelClasses}>
              Icon
            </label>
            {/*
              `icon` is a free @Size(max = 50) string on the backend — the seeded
              defaults happen to use emoji — so this is a plain text box with
              suggestions, not a closed picker. Anything typed here is accepted.
            */}
            <input
              id="category-icon"
              type="text"
              maxLength={50}
              value={values.icon ?? ''}
              onChange={(e) => update('icon', e.target.value || null)}
              placeholder="Pick one below, or type anything"
              className={inputClasses(!!errors.icon)}
              aria-invalid={!!errors.icon}
            />
            {errors.icon && (
              <p className="mt-1 text-xs text-red-500">{errors.icon}</p>
            )}
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {ICON_SUGGESTIONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => update('icon', icon)}
                  aria-label={`Use ${icon} as the icon`}
                  aria-pressed={values.icon === icon}
                  className={`flex h-9 w-9 items-center justify-center rounded-xl border text-base transition-all duration-150 ${
                    values.icon === icon
                      ? 'border-brand-blue bg-sky-100'
                      : 'border-sky-200 bg-white/70 hover:bg-white'
                  }`}
                >
                  <span aria-hidden="true">{icon}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="category-color" className={labelClasses}>
              Colour
            </label>
            {/*
              The backend @Pattern is ^$|^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$ — any
              #RGB or #RRGGBB value passes, and an empty value is explicitly valid
              too, so the presets below are a shortcut rather than a restriction.
            */}
            <div className="flex items-center gap-2.5">
              <input
                id="category-color"
                type="text"
                maxLength={7}
                value={values.colorHex ?? ''}
                onChange={(e) => update('colorHex', e.target.value || null)}
                placeholder="#3B6FE0"
                className={inputClasses(!!errors.colorHex)}
                aria-invalid={!!errors.colorHex}
              />
              {values.colorHex && (
                <button
                  type="button"
                  onClick={() => update('colorHex', null)}
                  className="shrink-0 rounded-pill px-3 py-2 text-xs font-semibold text-navy-700/60 hover:bg-sky-100"
                >
                  Clear
                </button>
              )}
            </div>
            {errors.colorHex && (
              <p className="mt-1 text-xs text-red-500">{errors.colorHex}</p>
            )}
            <div className="mt-2.5 flex flex-wrap gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => update('colorHex', preset)}
                  aria-label={`Use ${preset}`}
                  aria-pressed={values.colorHex === preset}
                  style={{ backgroundColor: preset }}
                  className={`h-8 w-8 rounded-full transition-all duration-150 ${
                    values.colorHex === preset
                      ? 'ring-2 ring-navy-900/40 ring-offset-2'
                      : ''
                  }`}
                />
              ))}
            </div>
          </div>

          {allowDefault && (
            <div className="sm:col-span-2">
              <label
                htmlFor="category-as-default"
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-lavender-200 bg-lavender-100/50 p-4"
              >
                <input
                  id="category-as-default"
                  type="checkbox"
                  checked={asDefault}
                  onChange={(e) => setAsDefault(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-sky-300 text-brand-purple"
                />
                <span>
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-navy-900">
                    <ShieldCheck className="h-3.5 w-3.5 text-brand-purple" />
                    Create as a shared default
                  </span>
                  <span className="mt-0.5 block text-xs text-navy-700/55">
                    Admin only. Sends this to POST /categories/defaults instead,
                    so every account gets it. Leave it off to create a category
                    just for yourself.
                  </span>
                </span>
              </label>
            </div>
          )}
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
