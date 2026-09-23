import { useState } from 'react';
import { PiggyBank, Plus } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Toast, type ToastState } from '@/components/common/Toast';
import { BudgetStats } from '@/components/budget/BudgetStats';
import { BudgetToolbar } from '@/components/budget/BudgetToolbar';
import { BudgetGrid } from '@/components/budget/BudgetGrid';
import { BudgetFormModal } from '@/components/budget/BudgetFormModal';
import { useBudgets } from '@/hooks/useBudgets';
import { extractErrorMessage } from '@/api/axiosClient';
import { todayISO } from '@/utils/format';
import type { BudgetRequest, BudgetResponse } from '@/types/budget';

/**
 * Module 6 — Budget Planner.
 */
function blankBudget(userId: number): BudgetRequest {
  return {
    userId,
    categoryId: null,
    period: 'MONTHLY',
    amount: null,
    startDate: todayISO(),
    alertThresholdPercent: 80,
  };
}

export default function BudgetsPage() {
  const {
    userId,
    status,
    errorMessage,
    budgets,
    visible,
    busy,
    categories,
    scope,
    alertsOnly,
    setScope,
    setAlertsOnly,
    reload,
    createBudget,
    updateBudget,
    deleteBudget,
  } = useBudgets();

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<BudgetResponse | null>(null);
  const [deleting, setDeleting] = useState<BudgetResponse | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const counts = {
    ALL: budgets.length,
    DAILY: budgets.filter((b) => b.period === 'DAILY').length,
    WEEKLY: budgets.filter((b) => b.period === 'WEEKLY').length,
    MONTHLY: budgets.filter((b) => b.period === 'MONTHLY').length,
  };

  const alertCount = budgets.filter((b) => b.alertTriggered).length;

  async function handleCreate(values: BudgetRequest) {
    try {
      await createBudget(values);
      setCreating(false);
      setToast({ type: 'success', message: 'Budget created successfully' });
    } catch (err) {
      setToast({
        type: 'error',
        message: extractErrorMessage(err, 'Could not create the budget.'),
      });
      throw err;
    }
  }

  async function handleUpdate(values: BudgetRequest) {
    if (!editing) return;
    try {
      await updateBudget(editing.id, values);
      setEditing(null);
      setToast({ type: 'success', message: 'Budget updated successfully' });
    } catch (err) {
      setToast({
        type: 'error',
        message: extractErrorMessage(err, 'Could not update the budget.'),
      });
      throw err;
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await deleteBudget(deleting.id);
      setDeleting(null);
      setToast({ type: 'success', message: 'Budget deleted' });
    } catch (err) {
      setToast({
        type: 'error',
        message: extractErrorMessage(err, 'Could not delete the budget.'),
      });
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <>
      <div className="space-y-6">
        <Header
          title="Budget Planner"
          subtitle="Set a limit, and watch your real spending fill it up"
          action={
            userId ? (
              <Button
                icon={<Plus className="h-4 w-4" />}
                onClick={() => setCreating(true)}
              >
                Add Budget
              </Button>
            ) : null
          }
        />

        {!userId && (
          <EmptyState
            variant="error"
            title="Not signed in"
            description="You need to be signed in to plan your budgets."
          />
        )}

        {userId && status === 'loading' && <BudgetSkeleton />}

        {userId && status === 'error' && (
          <EmptyState
            variant="error"
            title="Something went wrong"
            description={errorMessage ?? 'Please try again in a moment.'}
            actionLabel="Retry"
            onAction={reload}
          />
        )}

        {userId && status === 'success' && budgets.length === 0 && (
          <EmptyState
            icon={<PiggyBank className="h-7 w-7 text-brand-blue" />}
            title="No budgets yet"
            description="Create your first budget and your existing expenses will start filling it in straight away."
            actionLabel="Add Your First Budget"
            onAction={() => setCreating(true)}
          />
        )}

        {userId && status === 'success' && budgets.length > 0 && (
          <>
            <BudgetStats budgets={budgets} />
            <BudgetToolbar
              scope={scope}
              alertsOnly={alertsOnly}
              counts={counts}
              alertCount={alertCount}
              shown={visible.length}
              onScopeChange={setScope}
              onAlertsOnlyChange={setAlertsOnly}
            />
            <BudgetGrid
              budgets={visible}
              busy={busy}
              onEdit={setEditing}
              onDelete={setDeleting}
            />
          </>
        )}
      </div>

      {creating && userId && (
        <BudgetFormModal
          title="Add Budget"
          submitLabel="Add Budget"
          initialValues={blankBudget(userId)}
          categories={categories}
          onClose={() => setCreating(false)}
          onSubmit={handleCreate}
        />
      )}

      {/*
        PUT /budgets/{id} replaces every field, so the form is seeded with the
        whole current row. The computed values (spentAmount, percentUsed, endDate)
        are deliberately not sent — they are not on BudgetRequest; the backend
        recomputes them on the next read.
      */}
      {editing && (
        <BudgetFormModal
          title="Edit Budget"
          submitLabel="Save Changes"
          initialValues={{
            userId: editing.userId,
            categoryId: editing.categoryId,
            period: editing.period,
            amount: editing.amount,
            startDate: editing.startDate,
            alertThresholdPercent: editing.alertThresholdPercent,
          }}
          categories={categories}
          onClose={() => setEditing(null)}
          onSubmit={handleUpdate}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title={`Delete the ${
            deleting.categoryName ?? 'overall'
          } budget?`}
          message="This removes the budget only — your expenses are untouched. This cannot be undone."
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
function BudgetSkeleton() {
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
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass-card h-48" />
        ))}
      </div>
    </div>
  );
}
