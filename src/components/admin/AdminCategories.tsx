import { useCallback, useEffect, useState } from 'react';
import { Layers, Pencil, Plus, Trash2, X } from 'lucide-react';
import { adminService } from '@/api/adminService';
import { extractErrorMessage } from '@/api/axiosClient';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Toast, type ToastState } from '@/components/common/Toast';
import {
  CATEGORY_TYPES,
  type CategoryRequest,
  type CategoryResponse,
} from '@/types/category';

/**
 * System-wide default categories — /admin/categories/**.
 *
 * ⚠️ THESE ARE VISIBLE TO EVERY ACCOUNT. POST /defaults creates a row with
 * userId IS NULL, so editing or deleting one changes what every user sees. The
 * delete route is deliberately a force-delete: the user-facing endpoint refuses
 * to touch defaults, and this one does not.
 *
 * ⚠️ THE LIST ONLY SHOWS DEFAULTS, BUT PUT AND DELETE ACCEPT ANY CATEGORY ID.
 * GET /defaults filters to defaults, while the write routes work on custom
 * categories too — so nothing here can reach a user's own category, by design.
 */
export function AdminCategories() {
  const [items, setItems] = useState<CategoryResponse[]>([]);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<CategoryResponse | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<CategoryResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const load = useCallback(async () => {
    try {
      setItems(await adminService.getDefaultCategories());
      setError(null);
      setStatus('success');
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not load default categories.'));
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  async function handleSave(values: CategoryRequest) {
    if (editing) {
      await adminService.updateCategory(editing.id, values);
      setEditing(null);
      setToast({ type: 'success', message: 'Default category updated' });
    } else {
      await adminService.createDefaultCategory(values);
      setCreating(false);
      setToast({ type: 'success', message: 'Default category created' });
    }
    await load();
  }

  async function handleDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      await adminService.deleteCategory(deleting.id);
      setDeleting(null);
      await load();
      setToast({ type: 'success', message: 'Default category deleted' });
    } catch (err) {
      setToast({
        type: 'error',
        message: extractErrorMessage(err, 'Could not delete that category.'),
      });
    } finally {
      setBusy(false);
    }
  }

  if (status === 'loading') {
    return <div className="glass-card h-64 animate-pulse" />;
  }

  if (status === 'error') {
    return (
      <EmptyState
        variant="error"
        title="Could not load categories"
        description={error ?? 'Please try again in a moment.'}
        actionLabel="Retry"
        onAction={load}
      />
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="glass-card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-blue to-brand-purple text-white shadow-soft">
              <Layers className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-navy-900">
                Default Categories
              </h2>
              <p className="mt-0.5 text-xs text-navy-700/55">
                Every account sees these. {items.length} in total.
              </p>
            </div>
          </div>
          <Button
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setCreating(true)}
            className="shrink-0"
          >
            Add Default
          </Button>
        </div>

        {items.length === 0 ? (
          <EmptyState
            icon={<Layers className="h-7 w-7 text-brand-blue" />}
            title="No default categories"
            description="Without defaults, a new account starts with nothing to file expenses under."
            actionLabel="Add the First One"
            onAction={() => setCreating(true)}
          />
        ) : (
          <div className="glass-card divide-y divide-sky-100 p-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center gap-3 px-3 py-3"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base"
                  style={{
                    backgroundColor: item.colorHex
                      ? `${item.colorHex}22`
                      : 'rgb(224 240 255)',
                  }}
                >
                  {item.icon ?? '•'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-navy-900">
                    {item.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-navy-700/50">
                    {item.type === 'EXPENSE' ? 'Expense' : 'Income'}
                    {item.colorHex ? ` · ${item.colorHex}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditing(item)}
                    aria-label={`Edit ${item.name}`}
                    className="inline-flex items-center gap-1.5 rounded-pill border border-sky-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-navy-700 transition-colors hover:bg-white"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleting(item)}
                    aria-label={`Delete ${item.name}`}
                    className="inline-flex items-center gap-1.5 rounded-pill border border-red-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {(creating || editing) && (
        <DefaultCategoryModal
          initial={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSubmit={handleSave}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title={`Delete "${deleting.name}" for everyone?`}
          message="This is a system-wide category, so it disappears for every account. Expenses already filed under it keep the category name they were saved with."
          loading={busy}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </>
  );
}

/** Same four fields as CategoryRequest — the backend sets isDefault itself. */
function DefaultCategoryModal({
  initial,
  onClose,
  onSubmit,
}: {
  initial: CategoryResponse | null;
  onClose: () => void;
  onSubmit: (values: CategoryRequest) => Promise<void>;
}) {
  const [values, setValues] = useState<CategoryRequest>({
    name: initial?.name ?? '',
    type: initial?.type ?? 'EXPENSE',
    icon: initial?.icon ?? null,
    colorHex: initial?.colorHex ?? null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.name.trim()) {
      setFormError('Name is required.');
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      await onSubmit({ ...values, name: values.name.trim() });
    } catch (err) {
      setFormError(extractErrorMessage(err, 'Could not save that category.'));
    } finally {
      setSubmitting(false);
    }
  }

  const field =
    'w-full rounded-xl border border-sky-200 bg-white/70 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-700/30 focus:bg-white';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="fixed inset-0 bg-navy-900/30 backdrop-blur-sm"
      />
      <form
        onSubmit={submit}
        noValidate
        className="glass-card relative z-10 my-auto w-full max-w-md p-6 sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-bold text-navy-900">
            {initial ? 'Edit Default Category' : 'Add Default Category'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-navy-700/50 hover:bg-sky-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-3 rounded-xl bg-sky-50 px-4 py-2.5 text-xs text-navy-700/70">
          Saved as a system category — every account will see it.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <label
              className="mb-1.5 block text-xs font-semibold text-navy-700/70"
              htmlFor="def-cat-name"
            >
              Name
            </label>
            <input
              id="def-cat-name"
              type="text"
              maxLength={50}
              value={values.name}
              onChange={(e) => setValues({ ...values, name: e.target.value })}
              className={field}
            />
          </div>

          <div>
            <label
              className="mb-1.5 block text-xs font-semibold text-navy-700/70"
              htmlFor="def-cat-type"
            >
              Type
            </label>
            <select
              id="def-cat-type"
              value={values.type}
              onChange={(e) =>
                setValues({
                  ...values,
                  type: e.target.value as CategoryRequest['type'],
                })
              }
              className={field}
            >
              {CATEGORY_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className="mb-1.5 block text-xs font-semibold text-navy-700/70"
                htmlFor="def-cat-icon"
              >
                Icon — optional
              </label>
              <input
                id="def-cat-icon"
                type="text"
                maxLength={50}
                value={values.icon ?? ''}
                onChange={(e) =>
                  setValues({ ...values, icon: e.target.value || null })
                }
                placeholder="🍽️"
                className={field}
              />
            </div>
            <div>
              <label
                className="mb-1.5 block text-xs font-semibold text-navy-700/70"
                htmlFor="def-cat-color"
              >
                Colour — optional
              </label>
              <input
                id="def-cat-color"
                type="text"
                maxLength={7}
                value={values.colorHex ?? ''}
                onChange={(e) =>
                  setValues({ ...values, colorHex: e.target.value || null })
                }
                placeholder="#3B6FE0"
                className={field}
              />
            </div>
          </div>
        </div>

        {formError && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">
            {formError}
          </p>
        )}

        <div className="mt-6 flex items-center gap-3">
          <Button type="submit" loading={submitting}>
            {initial ? 'Save Changes' : 'Create'}
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
