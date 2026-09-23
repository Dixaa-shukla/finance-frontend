import { useState } from 'react';
import { Plus, Receipt } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { PageTabs } from '@/components/layout/PageTabs';
import { EXPENSE_TABS } from '@/config/pageTabs';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Toast, type ToastState } from '@/components/common/Toast';
import { ExpenseStats } from '@/components/expense/ExpenseStats';
import { CategoryBreakdown } from '@/components/expense/CategoryBreakdown';
import { ExpenseFilterBar } from '@/components/expense/ExpenseFilterBar';
import { ExpenseTable } from '@/components/expense/ExpenseTable';
import { ExpenseFormModal } from '@/components/expense/ExpenseFormModal';
import { useExpenses } from '@/hooks/useExpenses';
import { extractErrorMessage } from '@/api/axiosClient';
import { todayISO } from '@/utils/format';
import type { ExpenseRequest, ExpenseResponse } from '@/types/expense';

/** A fresh, empty add-expense form. UPI is the most common method in India. */
function blankExpense(userId: number): ExpenseRequest {
  return {
    userId,
    amount: null,
    category: '',
    merchant: null,
    expenseDate: todayISO(),
    paymentMethod: 'UPI',
    notes: null,
    receiptUrl: null,
    location: null,
    tags: [],
  };
}

export default function ExpensesPage() {
  const {
    userId,
    status,
    errorMessage,
    allExpenses,
    pageItems,
    totalPages,
    totalElements,
    page,
    busy,
    applyFilters,
    goToPage,
    reload,
    createExpense,
    updateExpense,
    deleteExpense,
  } = useExpenses();

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ExpenseResponse | null>(null);
  const [deleting, setDeleting] = useState<ExpenseResponse | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  async function handleCreate(values: ExpenseRequest) {
    try {
      await createExpense(values);
      setCreating(false);
      setToast({ type: 'success', message: 'Expense added successfully' });
    } catch (err) {
      setToast({
        type: 'error',
        message: extractErrorMessage(err, 'Could not add the expense.'),
      });
      throw err;
    }
  }

  async function handleUpdate(values: ExpenseRequest) {
    if (!editing) return;
    try {
      await updateExpense(editing.id, values);
      setEditing(null);
      setToast({ type: 'success', message: 'Expense updated successfully' });
    } catch (err) {
      setToast({
        type: 'error',
        message: extractErrorMessage(err, 'Could not update the expense.'),
      });
      throw err;
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await deleteExpense(deleting.id);
      setDeleting(null);
      setToast({ type: 'success', message: 'Expense deleted' });
    } catch (err) {
      setToast({
        type: 'error',
        message: extractErrorMessage(err, 'Could not delete the expense.'),
      });
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <>
      <div className="space-y-6">
        <Header
          title="Expenses"
          subtitle="Record, search and review every expense in one place"
          action={
            userId ? (
              <Button
                icon={<Plus className="h-4 w-4" />}
                onClick={() => setCreating(true)}
              >
                Add Expense
              </Button>
            ) : null
          }
        />

        <PageTabs tabs={EXPENSE_TABS} />

        {!userId && (
          <EmptyState
            variant="error"
            title="Not signed in"
            description="You need to be signed in to manage your expenses."
          />
        )}

        {userId && status === 'loading' && <ExpensesSkeleton />}

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
          /*
 * A new account has no expenses, which is different from no results after
 * applying filters. The table handles the filtered empty state so users can
 * still see and clear their filters.
 */
        }
        {userId && status === 'success' && allExpenses.length === 0 && (
          <EmptyState
            icon={<Receipt className="h-7 w-7 text-brand-blue" />}
            title="No expenses yet"
            description="Add your first expense and this page will start showing your spending totals and category breakdown."
            actionLabel="Add Your First Expense"
            onAction={() => setCreating(true)}
          />
        )}

        {userId && status === 'success' && allExpenses.length > 0 && (
          <>
            <ExpenseStats expenses={allExpenses} />
            <CategoryBreakdown expenses={allExpenses} />
            <ExpenseFilterBar onApply={applyFilters} />
            <ExpenseTable
              expenses={pageItems}
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
        <ExpenseFormModal
          title="Add Expense"
          submitLabel="Add Expense"
          initialValues={blankExpense(userId)}
          onClose={() => setCreating(false)}
          onSubmit={handleCreate}
        />
      )}

      {editing && (
        <ExpenseFormModal
          title="Edit Expense"
          submitLabel="Save Changes"
          initialValues={{
            userId: editing.userId,
            amount: editing.amount,
            category: editing.category,
            merchant: editing.merchant,
            expenseDate: editing.expenseDate,
            paymentMethod: editing.paymentMethod,
            notes: editing.notes,
            receiptUrl: editing.receiptUrl,
            location: editing.location,
            tags: editing.tags ?? [],
          }}
          onClose={() => setEditing(null)}
          onSubmit={handleUpdate}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete this expense?"
          message={`${deleting.merchant || deleting.category} — this cannot be undone.`}
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
function ExpensesSkeleton() {
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
