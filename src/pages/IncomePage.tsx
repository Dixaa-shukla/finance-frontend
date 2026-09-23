import { useState } from 'react';
import { Plus, TrendingUp } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Toast, type ToastState } from '@/components/common/Toast';
import { IncomeStats } from '@/components/income/IncomeStats';
import { SourceBreakdown } from '@/components/income/SourceBreakdown';
import { IncomeFilterBar } from '@/components/income/IncomeFilterBar';
import { IncomeTable } from '@/components/income/IncomeTable';
import { IncomeFormModal } from '@/components/income/IncomeFormModal';
import { useIncomes } from '@/hooks/useIncomes';
import { extractErrorMessage } from '@/api/axiosClient';
import { formatINRExact, todayISO } from '@/utils/format';
import { INCOME_SOURCES, type IncomeRequest, type IncomeResponse } from '@/types/income';

/**
 * Creates a fresh add-income form with SALARY as the default source.
 * isRecurring is set to false because the backend requires this field.
 */
function blankIncome(userId: number): IncomeRequest {
  return {
    userId,
    amount: null,
    source: 'SALARY',
    categoryId: null,
    incomeDate: todayISO(),
    notes: null,
    isRecurring: false,
  };
}

function sourceLabel(value: string): string {
  const match = INCOME_SOURCES.find((source) => source.value === value);
  return match ? match.label : value;
}

export default function IncomePage() {
  const {
    userId,
    status,
    errorMessage,
    allIncomes,
    pageItems,
    totalPages,
    totalElements,
    page,
    filters,
    busy,
    categories,
    applyFilters,
    goToPage,
    reload,
    createIncome,
    updateIncome,
    deleteIncome,
  } = useIncomes();

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<IncomeResponse | null>(null);
  const [deleting, setDeleting] = useState<IncomeResponse | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  async function handleCreate(values: IncomeRequest) {
    try {
      await createIncome(values);
      setCreating(false);
      setToast({ type: 'success', message: 'Income added successfully' });
    } catch (err) {
      setToast({
        type: 'error',
        message: extractErrorMessage(err, 'Could not add the income.'),
      });
      throw err;
    }
  }

  async function handleUpdate(values: IncomeRequest) {
    if (!editing) return;
    try {
      await updateIncome(editing.id, values);
      setEditing(null);
      setToast({ type: 'success', message: 'Income updated successfully' });
    } catch (err) {
      setToast({
        type: 'error',
        message: extractErrorMessage(err, 'Could not update the income.'),
      });
      throw err;
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await deleteIncome(deleting.id);
      setDeleting(null);
      setToast({ type: 'success', message: 'Income deleted' });
    } catch (err) {
      setToast({
        type: 'error',
        message: extractErrorMessage(err, 'Could not delete the income.'),
      });
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <>
      <div className="space-y-6">
        <Header
          title="Income"
          subtitle="Record every source of income and see what it adds up to"
          action={
            userId ? (
              <Button
                icon={<Plus className="h-4 w-4" />}
                onClick={() => setCreating(true)}
              >
                Add Income
              </Button>
            ) : null
          }
        />

        {!userId && (
          <EmptyState
            variant="error"
            title="Not signed in"
            description="You need to be signed in to manage your income."
          />
        )}

        {userId && status === 'loading' && <IncomeSkeleton />}

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
        {userId && status === 'success' && allIncomes.length === 0 && (
          <EmptyState
            icon={<TrendingUp className="h-7 w-7 text-brand-green" />}
            title="No income yet"
            description="Add your first income entry and this page will start showing your totals and where your money comes from."
            actionLabel="Add Your First Income"
            onAction={() => setCreating(true)}
          />
        )}

        {userId && status === 'success' && allIncomes.length > 0 && (
          <>
            <IncomeStats incomes={allIncomes} />
            <SourceBreakdown incomes={allIncomes} />
            <IncomeFilterBar
              filters={filters}
              categories={categories}
              onApply={applyFilters}
            />
            <IncomeTable
              incomes={pageItems}
              page={page}
              totalPages={totalPages}
              totalElements={totalElements}
              busy={busy}
              onEdit={setEditing}
              onDelete={setDeleting}
              onPageChange={goToPage}
            />
          </>
        )}
      </div>

      {creating && userId && (
        <IncomeFormModal
          title="Add Income"
          submitLabel="Add Income"
          initialValues={blankIncome(userId)}
          categories={categories}
          onClose={() => setCreating(false)}
          onSubmit={handleCreate}
        />
      )}

      {editing && (
        <IncomeFormModal
          title="Edit Income"
          submitLabel="Save Changes"
          initialValues={{
            userId: editing.userId,
            amount: editing.amount,
            source: editing.source,
            categoryId: editing.categoryId,
            incomeDate: editing.incomeDate,
            notes: editing.notes,
            // response `recurring` -> request `isRecurring`. Not a typo.
            isRecurring: editing.recurring,
          }}
          categories={categories}
          onClose={() => setEditing(null)}
          onSubmit={handleUpdate}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete this income entry?"
          message={`${sourceLabel(deleting.source)} — ${formatINRExact(
            deleting.amount
          )}. This cannot be undone.`}
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
function IncomeSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card h-28 p-5">
            <div className="h-3 w-24 rounded bg-sky-200/60" />
            <div className="mt-4 h-6 w-32 rounded bg-sky-200/70" />
          </div>
        ))}
      </div>
      <div className="glass-card h-48" />
      <div className="glass-card h-72" />
    </div>
  );
}
