import { useState } from 'react';
import { Plus, Tags } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { PageTabs } from '@/components/layout/PageTabs';
import { SETTINGS_TABS } from '@/config/pageTabs';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Toast, type ToastState } from '@/components/common/Toast';
import { CategoryStats } from '@/components/category/CategoryStats';
import { CategoryToolbar } from '@/components/category/CategoryToolbar';
import { CategoryGrid } from '@/components/category/CategoryGrid';
import { CategoryFormModal } from '@/components/category/CategoryFormModal';
import { useCategories } from '@/hooks/useCategories';
import { useAuth } from '@/hooks/useAuth';
import { extractErrorMessage } from '@/api/axiosClient';
import type { CategoryRequest, CategoryResponse } from '@/types/category';

/**
 * Module 5 — Category Management.
 */
function blankCategory(): CategoryRequest {
  return { name: '', type: 'EXPENSE', icon: null, colorHex: null };
}

export default function CategoriesPage() {
  const { isAdmin } = useAuth();
  const {
    userId,
    status,
    errorMessage,
    categories,
    visible,
    busy,
    scope,
    search,
    setScope,
    setSearch,
    reload,
    createCustom,
    createDefault,
    updateCategory,
    deleteCategory,
  } = useCategories();

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<CategoryResponse | null>(null);
  const [deleting, setDeleting] = useState<CategoryResponse | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const counts = {
    ALL: categories.length,
    EXPENSE: categories.filter((c) => c.type === 'EXPENSE').length,
    INCOME: categories.filter((c) => c.type === 'INCOME').length,
  };

  /**
 * Uses the selected option to choose the correct category route.
 * Admin default categories use the shared defaults route; otherwise the user's
 * custom category route is used. Duplicate names return 409 and the message is shown as-is.
 */
  async function handleCreate(values: CategoryRequest, asDefault: boolean) {
    try {
      if (asDefault) {
        await createDefault(values);
      } else {
        await createCustom(values);
      }
      setCreating(false);
      setToast({
        type: 'success',
        message: asDefault
          ? 'Shared default category created'
          : 'Category created successfully',
      });
    } catch (err) {
      setToast({
        type: 'error',
        message: extractErrorMessage(err, 'Could not create the category.'),
      });
      throw err;
    }
  }

  async function handleUpdate(values: CategoryRequest) {
    if (!editing) return;
    try {
      await updateCategory(editing.id, values);
      setEditing(null);
      setToast({ type: 'success', message: 'Category updated successfully' });
    } catch (err) {
      setToast({
        type: 'error',
        message: extractErrorMessage(err, 'Could not update the category.'),
      });
      throw err;
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await deleteCategory(deleting);
      setDeleting(null);
      setToast({ type: 'success', message: 'Category deleted' });
    } catch (err) {
      setToast({
        type: 'error',
        message: extractErrorMessage(err, 'Could not delete the category.'),
      });
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <>
      <div className="space-y-6">
        <Header
          title="Categories"
          subtitle="Organise your spending and earnings under the labels you actually use"
          action={
            userId ? (
              <Button
                icon={<Plus className="h-4 w-4" />}
                onClick={() => setCreating(true)}
              >
                Add Category
              </Button>
            ) : null
          }
        />

        <PageTabs tabs={SETTINGS_TABS} />

        {!userId && (
          <EmptyState
            variant="error"
            title="Not signed in"
            description="You need to be signed in to manage your categories."
          />
        )}

        {userId && status === 'loading' && <CategorySkeleton />}

        {userId && status === 'error' && (
          <EmptyState
            variant="error"
            title="Something went wrong"
            description={errorMessage ?? 'Please try again in a moment.'}
            actionLabel="Retry"
            onAction={reload}
          />
        )}

        {
          
        }
        {userId && status === 'success' && categories.length === 0 && (
          <EmptyState
            icon={<Tags className="h-7 w-7 text-brand-blue" />}
            title="No categories yet"
            description="Create your first category and it will show up wherever you record an expense or an income."
            actionLabel="Add Your First Category"
            onAction={() => setCreating(true)}
          />
        )}

        {userId && status === 'success' && categories.length > 0 && (
          <>
            <CategoryStats categories={categories} />
            <CategoryToolbar
              scope={scope}
              search={search}
              counts={counts}
              shown={visible.length}
              onScopeChange={setScope}
              onSearchChange={setSearch}
            />
            <CategoryGrid
              categories={visible}
              busy={busy}
              isAdmin={isAdmin}
              onEdit={setEditing}
              onDelete={setDeleting}
            />
          </>
        )}
      </div>

      {creating && userId && (
        <CategoryFormModal
          title="Add Category"
          submitLabel="Add Category"
          initialValues={blankCategory()}
          /* Shown only to an admin, and only while creating: no route converts
             an existing category between custom and default. */
          allowDefault={isAdmin}
          onClose={() => setCreating(false)}
          onSubmit={handleCreate}
        />
      )}

      {editing && (
        <CategoryFormModal
          title={editing.default ? 'Edit Shared Default' : 'Edit Category'}
          submitLabel="Save Changes"
          initialValues={{
            name: editing.name,
            type: editing.type,
            icon: editing.icon,
            colorHex: editing.colorHex,
          }}
          allowDefault={false}
          onClose={() => setEditing(null)}
          onSubmit={handleUpdate}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title={
            deleting.default
              ? `Delete the shared default "${deleting.name}"?`
              : `Delete "${deleting.name}"?`
          }
          message={
            deleting.default
              ? 'This removes it for every account, through the admin route. This cannot be undone.'
              : 'This removes the category from your account. This cannot be undone.'
          }
          loading={deleteBusy}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </>
  );
}

/** Matches the real layout's shape so the page doesn't jump when data lands. */
function CategorySkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card h-28 p-5">
            <div className="h-3 w-24 rounded bg-sky-200/60" />
            <div className="mt-4 h-6 w-16 rounded bg-sky-200/70" />
          </div>
        ))}
      </div>
      <div className="glass-card h-20" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass-card h-32" />
        ))}
      </div>
    </div>
  );
}
