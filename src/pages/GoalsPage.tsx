import { useState } from 'react';
import { Plus, Target } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Toast, type ToastState } from '@/components/common/Toast';
import { GoalStats } from '@/components/goal/GoalStats';
import { GoalToolbar } from '@/components/goal/GoalToolbar';
import { GoalGrid } from '@/components/goal/GoalGrid';
import { GoalFormModal } from '@/components/goal/GoalFormModal';
import { GoalContributeModal } from '@/components/goal/GoalContributeModal';
import { useGoals } from '@/hooks/useGoals';
import { extractErrorMessage } from '@/api/axiosClient';
import { formatINR, todayISO } from '@/utils/format';
import type { GoalRequest, GoalResponse } from '@/types/goal';

/**
 * Module 7 — Financial Goals.
 */
function blankGoal(userId: number): GoalRequest {
  return {
    userId,
    title: '',
    description: null,
    targetAmount: null,
    targetDate: todayISO(),
  };
}

export default function GoalsPage() {
  const {
    userId,
    status,
    errorMessage,
    goals,
    visible,
    busy,
    scope,
    search,
    setScope,
    setSearch,
    reload,
    createGoal,
    updateGoal,
    contribute,
    deleteGoal,
  } = useGoals();

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<GoalResponse | null>(null);
  const [contributing, setContributing] = useState<GoalResponse | null>(null);
  const [deleting, setDeleting] = useState<GoalResponse | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const counts = {
    ALL: goals.length,
    IN_PROGRESS: goals.filter((g) => g.status === 'IN_PROGRESS').length,
    COMPLETED: goals.filter((g) => g.status === 'COMPLETED').length,
    EXPIRED: goals.filter((g) => g.status === 'EXPIRED').length,
  };

  async function handleCreate(values: GoalRequest) {
    try {
      await createGoal(values);
      setCreating(false);
      setToast({ type: 'success', message: 'Goal created successfully' });
    } catch (err) {
      setToast({
        type: 'error',
        message: extractErrorMessage(err, 'Could not create the goal.'),
      });
      throw err;
    }
  }

  async function handleUpdate(values: GoalRequest) {
    if (!editing) return;
    try {
      await updateGoal(editing.id, values);
      setEditing(null);
      setToast({ type: 'success', message: 'Goal updated successfully' });
    } catch (err) {
      setToast({
        type: 'error',
        message: extractErrorMessage(err, 'Could not update the goal.'),
      });
      throw err;
    }
  }

  /**
   * The response carries the recomputed status, so the toast can say whether that
   * contribution actually finished the goal instead of guessing.
   */
  async function handleContribute(amount: number) {
    if (!contributing) return;
    try {
      const updated = await contribute(contributing.id, { amount });
      setContributing(null);
      setToast({
        type: 'success',
        message:
          updated.status === 'COMPLETED'
            ? `${formatINR(amount)} added — goal completed!`
            : `${formatINR(amount)} added to ${updated.title}`,
      });
    } catch (err) {
      setToast({
        type: 'error',
        message: extractErrorMessage(err, 'Could not record the contribution.'),
      });
      throw err;
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await deleteGoal(deleting.id);
      setDeleting(null);
      setToast({ type: 'success', message: 'Goal deleted' });
    } catch (err) {
      setToast({
        type: 'error',
        message: extractErrorMessage(err, 'Could not delete the goal.'),
      });
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <>
      <div className="space-y-6">
        <Header
          title="Goals"
          subtitle="Name the target, add to it as you save, and watch the deadline"
          action={
            userId ? (
              <Button
                icon={<Plus className="h-4 w-4" />}
                onClick={() => setCreating(true)}
              >
                Add Goal
              </Button>
            ) : null
          }
        />

        {!userId && (
          <EmptyState
            variant="error"
            title="Not signed in"
            description="You need to be signed in to track your financial goals."
          />
        )}

        {userId && status === 'loading' && <GoalSkeleton />}

        {userId && status === 'error' && (
          <EmptyState
            variant="error"
            title="Something went wrong"
            description={errorMessage ?? 'Please try again in a moment.'}
            actionLabel="Retry"
            onAction={reload}
          />
        )}

        {userId && status === 'success' && goals.length === 0 && (
          <EmptyState
            icon={<Target className="h-7 w-7 text-brand-blue" />}
            title="No goals yet"
            description="Set a target amount and a date, then record what you save towards it as you go."
            actionLabel="Add Your First Goal"
            onAction={() => setCreating(true)}
          />
        )}

        {userId && status === 'success' && goals.length > 0 && (
          <>
            <GoalStats goals={goals} />
            <GoalToolbar
              scope={scope}
              search={search}
              counts={counts}
              shown={visible.length}
              onScopeChange={setScope}
              onSearchChange={setSearch}
            />
            <GoalGrid
              goals={visible}
              busy={busy}
              onContribute={setContributing}
              onEdit={setEditing}
              onDelete={setDeleting}
            />
          </>
        )}
      </div>

      {creating && userId && (
        <GoalFormModal
          title="Add Goal"
          submitLabel="Add Goal"
          initialValues={blankGoal(userId)}
          onClose={() => setCreating(false)}
          onSubmit={handleCreate}
        />
      )}

      {
        /*
 * PUT /goals/{id} updates the four editable fields, so the form starts with
 * the current goal values. currentAmount is not changed here, and the backend
 * recalculates the other values when the goal is loaded again.
 */
      }
      {editing && (
        <GoalFormModal
          title="Edit Goal"
          submitLabel="Save Changes"
          initialValues={{
            userId: editing.userId,
            title: editing.title,
            description: editing.description,
            targetAmount: editing.targetAmount,
            targetDate: editing.targetDate,
          }}
          onClose={() => setEditing(null)}
          onSubmit={handleUpdate}
        />
      )}

      {contributing && (
        <GoalContributeModal
          goal={contributing}
          onClose={() => setContributing(null)}
          onSubmit={handleContribute}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title={`Delete "${deleting.title}"?`}
          message="The goal and everything recorded against it go with it — contributions are not stored anywhere else. This cannot be undone."
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
function GoalSkeleton() {
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
          <div key={i} className="glass-card h-52" />
        ))}
      </div>
    </div>
  );
}
