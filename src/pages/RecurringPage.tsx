import { useState } from 'react';
import { Plus, Repeat, Zap } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { PageTabs } from '@/components/layout/PageTabs';
import { TRANSACTION_TABS } from '@/config/pageTabs';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Toast, type ToastState } from '@/components/common/Toast';
import { RecurringStats } from '@/components/recurring/RecurringStats';
import { RecurringToolbar } from '@/components/recurring/RecurringToolbar';
import { RecurringGrid } from '@/components/recurring/RecurringGrid';
import { RecurringFormModal } from '@/components/recurring/RecurringFormModal';
import { ProcessDueModal } from '@/components/recurring/ProcessDueModal';
import { useRecurring, isOverdue } from '@/hooks/useRecurring';
import { extractErrorMessage } from '@/api/axiosClient';
import { todayISO } from '@/utils/format';
import type {
  RecurringTransactionRequest,
  RecurringTransactionResponse,
} from '@/types/recurring';

/**
 * Module 9 — Recurring Transactions.
 */
function blankRule(userId: number): RecurringTransactionRequest {
  return {
    userId,
    type: 'EXPENSE',
    title: '',
    amount: null,
    category: null,
    incomeSource: null,
    paymentMethod: null,
    frequency: 'MONTHLY',
    startDate: todayISO(),
    endDate: null,
    notes: null,
  };
}

export default function RecurringPage() {
  const {
    userId,
    status,
    errorMessage,
    rules,
    visible,
    overdueRules,
    busy,
    scope,
    typeFilter,
    search,
    setScope,
    setTypeFilter,
    setSearch,
    reload,
    createRule,
    updateRule,
    toggleActive,
    deleteRule,
    processDue,
  } = useRecurring();

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<RecurringTransactionResponse | null>(null);
  const [deleting, setDeleting] = useState<RecurringTransactionResponse | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [sweeping, setSweeping] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const counts = {
    ALL: rules.length,
    ACTIVE: rules.filter((rule) => rule.active).length,
    PAUSED: rules.filter((rule) => !rule.active).length,
    OVERDUE: rules.filter(isOverdue).length,
  };

  async function handleCreate(values: RecurringTransactionRequest) {
    try {
      await createRule(values);
      setCreating(false);
      setToast({ type: 'success', message: 'Recurring rule created' });
    } catch (err) {
      setToast({
        type: 'error',
        message: extractErrorMessage(err, 'Could not create the rule.'),
      });
      throw err;
    }
  }

  async function handleUpdate(values: RecurringTransactionRequest) {
    if (!editing) return;
    try {
      await updateRule(editing.id, values);
      setEditing(null);
      setToast({ type: 'success', message: 'Recurring rule updated' });
    } catch (err) {
      setToast({
        type: 'error',
        message: extractErrorMessage(err, 'Could not update the rule.'),
      });
      throw err;
    }
  }

  /**
 * Pausing is simple, but resuming can create missed occurrences because the
 * next due date stays unchanged while paused.
 */
  async function handleToggle(rule: RecurringTransactionResponse) {
    try {
      const updated = await toggleActive(rule);
      setToast({
        type: 'success',
        message: updated.active
          ? isOverdue(updated)
            ? `${updated.title} resumed — it is already due, so the next run will catch it up`
            : `${updated.title} resumed`
          : `${updated.title} paused — it will not generate anything`,
      });
    } catch (err) {
      setToast({
        type: 'error',
        message: extractErrorMessage(err, 'Could not change the rule.'),
      });
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await deleteRule(deleting.id);
      setDeleting(null);
      setToast({ type: 'success', message: 'Recurring rule deleted' });
    } catch (err) {
      setToast({
        type: 'error',
        message: extractErrorMessage(err, 'Could not delete the rule.'),
      });
    } finally {
      setDeleteBusy(false);
    }
  }

  /**
 * The count is the total number of transactions created across all users.
 * The message should show it as a system total, not as transactions created for the current user.
 */
  async function handleProcessDue() {
    const result = await processDue();
    setSweeping(false);
    setToast({
      type: 'success',
      message:
        result.transactionsGenerated === 0
          ? 'Sweep finished — nothing was due'
          : `Sweep finished — ${result.transactionsGenerated} transaction${
              result.transactionsGenerated === 1 ? '' : 's'
            } generated across all accounts. Check Expenses and Income.`,
    });
  }

  return (
    <>
      <div className="space-y-6">
        <Header
          title="Recurring Transactions"
          subtitle="Rules that create your expenses and income automatically, on schedule"
          action={
            userId ? (
              <div className="flex flex-wrap items-center gap-3">
                {
                  /*
 * Shows this button only when the current user has a rule that the sweep would process.
 * Without this check, the button could run the system-wide sweep and affect other users.
 */
                }
                {overdueRules.length > 0 && (
                  <Button
                    variant="secondary"
                    icon={<Zap className="h-4 w-4" />}
                    onClick={() => setSweeping(true)}
                  >
                    Run Due Now
                  </Button>
                )}
                <Button
                  icon={<Plus className="h-4 w-4" />}
                  onClick={() => setCreating(true)}
                >
                  Add Rule
                </Button>
              </div>
            ) : null
          }
        />

        <PageTabs tabs={TRANSACTION_TABS} />

        {!userId && (
          <EmptyState
            variant="error"
            title="Not signed in"
            description="You need to be signed in to manage your recurring rules."
          />
        )}

        {userId && status === 'loading' && <RecurringSkeleton />}

        {userId && status === 'error' && (
          <EmptyState
            variant="error"
            title="Something went wrong"
            description={errorMessage ?? 'Please try again in a moment.'}
            actionLabel="Retry"
            onAction={reload}
          />
        )}

        {userId && status === 'success' && rules.length === 0 && (
          <EmptyState
            icon={<Repeat className="h-7 w-7 text-brand-blue" />}
            title="No recurring rules yet"
            description="Add a rule for anything that repeats — rent, salary, a subscription — and the nightly run will create each occurrence for you."
            actionLabel="Add Your First Rule"
            onAction={() => setCreating(true)}
          />
        )}

        {userId && status === 'success' && rules.length > 0 && (
          <>
            {/*
              A real state, not a nag: these rules are past due and the sweep has
              not run since. The banner names the count so the number of rows
              about to appear is not a surprise.
            */}
            {overdueRules.length > 0 && (
              <div className="glass-card flex flex-col gap-3 border-l-4 border-l-amber-400 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div>
                  <p className="text-sm font-bold text-navy-900">
                    {overdueRules.length} rule
                    {overdueRules.length === 1 ? ' is' : 's are'} past due
                  </p>
                  <p className="mt-0.5 text-xs text-navy-700/55">
                    The nightly run at 01:00 will create every missed occurrence.
                    You can run it now if you do not want to wait.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  icon={<Zap className="h-4 w-4" />}
                  onClick={() => setSweeping(true)}
                  className="shrink-0"
                >
                  Run Due Now
                </Button>
              </div>
            )}

            <RecurringStats rules={rules} />
            <RecurringToolbar
              scope={scope}
              typeFilter={typeFilter}
              search={search}
              counts={counts}
              shown={visible.length}
              onScopeChange={setScope}
              onTypeChange={setTypeFilter}
              onSearchChange={setSearch}
            />
            <RecurringGrid
              rules={visible}
              busy={busy}
              onToggle={handleToggle}
              onEdit={setEditing}
              onDelete={setDeleting}
            />
          </>
        )}

      </div>

      {creating && userId && (
        <RecurringFormModal
          title="Add Recurring Rule"
          submitLabel="Add Rule"
          editing={false}
          initialValues={blankRule(userId)}
          onClose={() => setCreating(false)}
          onSubmit={handleCreate}
        />
      )}

      {
        /*
 * PUT needs the full RecurringTransactionRequest, so the form starts with the
 * current values. startDate is required by the DTO, but it does not change the
 * next due date when the rule is updated.
 */
      }
      {editing && (
        <RecurringFormModal
          title="Edit Recurring Rule"
          submitLabel="Save Changes"
          editing
          initialValues={{
            userId: editing.userId,
            type: editing.type,
            title: editing.title,
            amount: editing.amount,
            category: editing.category,
            incomeSource: editing.incomeSource,
            paymentMethod: editing.paymentMethod,
            frequency: editing.frequency,
            startDate: editing.startDate,
            endDate: editing.endDate,
            notes: editing.notes,
          }}
          onClose={() => setEditing(null)}
          onSubmit={handleUpdate}
        />
      )}

      {
      /*
 * DELETE removes only the recurring rule.
 * Previously created Expense or Income records are not deleted and will remain.
 */}
      {deleting && (
        <ConfirmDialog
          title={`Delete "${deleting.title}"?`}
          message="The rule stops here and nothing further is generated. Transactions it has already created stay in your Expense and Income lists — delete those separately if you want them gone."
          loading={deleteBusy}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}

      {sweeping && (
        <ProcessDueModal
          overdueRules={overdueRules}
          onClose={() => setSweeping(false)}
          onConfirm={handleProcessDue}
        />
      )}


      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </>
  );
}

/** Matches the real layout's shape so the page doesn't jump when data lands. */
function RecurringSkeleton() {
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
          <div key={i} className="glass-card h-64" />
        ))}
      </div>
    </div>
  );
}


