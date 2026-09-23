import { useState } from 'react';
import { ChartLine, Plus, RefreshCw } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Toast, type ToastState } from '@/components/common/Toast';
import { InvestmentStats } from '@/components/investment/InvestmentStats';
import { InvestmentAllocation } from '@/components/investment/InvestmentAllocation';
import { InvestmentToolbar } from '@/components/investment/InvestmentToolbar';
import { InvestmentGrid } from '@/components/investment/InvestmentGrid';
import { InvestmentFormModal } from '@/components/investment/InvestmentFormModal';
import { useInvestments } from '@/hooks/useInvestments';
import { extractErrorMessage } from '@/api/axiosClient';
import { todayISO } from '@/utils/format';
import type {
  InvestmentRequest,
  InvestmentResponse,
} from '@/types/investment';

/** A fresh holding: a mutual fund bought today, the commonest starting point. */
function blankInvestment(userId: number): InvestmentRequest {
  return {
    userId,
    type: 'MUTUAL_FUND',
    name: '',
    investedAmount: null,
    currentValue: null,
    quantity: null,
    purchaseDate: todayISO(),
    maturityDate: null,
    interestRate: null,
    notes: null,
  };
}

export default function InvestmentsPage() {
  const {
    userId,
    status,
    errorMessage,
    visible,
    summary,
    countsByType,
    maturedCount,
    busy,
    typeFilter,
    search,
    setTypeFilter,
    setSearch,
    reload,
    createInvestment,
    updateInvestment,
    deleteInvestment,
  } = useInvestments();

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<InvestmentResponse | null>(null);
  const [deleting, setDeleting] = useState<InvestmentResponse | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  // The summary always covers the whole portfolio, so it — not the loaded rows —
  // decides whether the user owns anything at all.
  const totalCount = summary ? summary.totalInvestmentCount : 0;

  async function handleCreate(values: InvestmentRequest) {
    try {
      await createInvestment(values);
      setCreating(false);
      setToast({ type: 'success', message: 'Holding added to your portfolio' });
    } catch (err) {
      setToast({
        type: 'error',
        message: extractErrorMessage(err, 'Could not add the holding.'),
      });
      throw err;
    }
  }

  async function handleUpdate(values: InvestmentRequest) {
    if (!editing) return;
    try {
      await updateInvestment(editing.id, values);
      setEditing(null);
      setToast({ type: 'success', message: 'Holding updated' });
    } catch (err) {
      setToast({
        type: 'error',
        message: extractErrorMessage(err, 'Could not update the holding.'),
      });
      throw err;
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await deleteInvestment(deleting.id);
      setDeleting(null);
      setToast({ type: 'success', message: 'Holding deleted' });
    } catch (err) {
      setToast({
        type: 'error',
        message: extractErrorMessage(err, 'Could not delete the holding.'),
      });
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <>
      <div className="space-y-6">
        <Header
          title="Investments"
          subtitle="Everything you hold, what it cost you, and what it is worth now"
          action={
            userId ? (
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="secondary"
                  icon={<RefreshCw className="h-4 w-4" />}
                  onClick={reload}
                  loading={busy}
                >
                  Refresh
                </Button>
                <Button
                  icon={<Plus className="h-4 w-4" />}
                  onClick={() => setCreating(true)}
                >
                  Add Holding
                </Button>
              </div>
            ) : null
          }
        />

        {!userId && (
          <EmptyState
            variant="error"
            title="Not signed in"
            description="You need to be signed in to see your portfolio."
          />
        )}

        {userId && status === 'loading' && <InvestmentSkeleton />}

        {userId && status === 'error' && (
          <EmptyState
            variant="error"
            title="Something went wrong"
            description={errorMessage ?? 'Please try again in a moment.'}
            actionLabel="Retry"
            onAction={reload}
          />
        )}

        {userId && status === 'success' && totalCount === 0 && (
          <EmptyState
            icon={<ChartLine className="h-7 w-7 text-brand-blue" />}
            title="No holdings yet"
            description="Add a stock, mutual fund, SIP, deposit or anything else you have money in, and this page will track its value against what you paid."
            actionLabel="Add Your First Holding"
            onAction={() => setCreating(true)}
          />
        )}

        {userId && status === 'success' && summary && totalCount > 0 && (
          <>
            <InvestmentStats
              summary={summary}
              // Counted from the loaded rows, which the type chips filter — so it
              // is only a portfolio-wide figure while no filter is applied.
              maturedCount={typeFilter === '' ? maturedCount : 0}
            />

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <div className="xl:col-span-1">
                <InvestmentAllocation summary={summary} />
              </div>
              <div className="space-y-4 xl:col-span-2">
                <InvestmentToolbar
                  typeFilter={typeFilter}
                  search={search}
                  countsByType={countsByType}
                  totalCount={totalCount}
                  shown={visible.length}
                  onTypeChange={setTypeFilter}
                  onSearchChange={setSearch}
                />
                <InvestmentGrid
                  investments={visible}
                  busy={busy}
                  onEdit={setEditing}
                  onDelete={setDeleting}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {creating && userId && (
        <InvestmentFormModal
          title="Add Holding"
          submitLabel="Add Holding"
          editing={false}
          initialValues={blankInvestment(userId)}
          onClose={() => setCreating(false)}
          onSubmit={handleCreate}
        />
      )}

      {/* PUT replaces every column, so the form is seeded from the current row. */}
      {editing && (
        <InvestmentFormModal
          title="Update Holding"
          submitLabel="Save Changes"
          editing
          initialValues={{
            userId: editing.userId,
            type: editing.type,
            name: editing.name,
            investedAmount: editing.investedAmount,
            currentValue: editing.currentValue,
            quantity: editing.quantity,
            purchaseDate: editing.purchaseDate,
            maturityDate: editing.maturityDate,
            interestRate: editing.interestRate,
            notes: editing.notes,
          }}
          onClose={() => setEditing(null)}
          onSubmit={handleUpdate}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title={`Delete "${deleting.name}"?`}
          message="The holding and its recorded value are removed from your portfolio. This cannot be undone."
          loading={deleteBusy}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </>
  );
}

/** Matches the real layout so the page doesn't jump when data lands. */
function InvestmentSkeleton() {
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
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="glass-card h-80" />
        <div className="space-y-4 xl:col-span-2">
          <div className="glass-card h-20" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card h-56" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
