import { useState } from 'react';
import { ArrowLeftRight, Info, X } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { PageTabs } from '@/components/layout/PageTabs';
import { TRANSACTION_TABS } from '@/config/pageTabs';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { Toast, type ToastState } from '@/components/common/Toast';
import { TransactionStats } from '@/components/transaction/TransactionStats';
import { TransactionFilterBar } from '@/components/transaction/TransactionFilterBar';
import { TransactionTable } from '@/components/transaction/TransactionTable';
import { useTransactions } from '@/hooks/useTransactions';

/**
 * Module 8 — Transaction Management.
 */
export default function TransactionsPage() {
  const {
    userId,
    status,
    errorMessage,
    allMatching,
    pageItems,
    totalPages,
    totalElements,
    page,
    filters,
    sort,
    busy,
    mode,
    searchTerm,
    searchResults,
    searchError,
    searching,
    exporting,
    applyFilters,
    changeSort,
    goToPage,
    reload,
    runDeepSearch,
    exitDeepSearch,
    exportCsv,
  } = useTransactions();

  const [toast, setToast] = useState<ToastState | null>(null);

  /** Distinguishes "you have no transactions" from "no transaction matches". */
  const filtersActive = Object.values(filters).some((value) => value !== '');

  async function handleExport() {
    try {
      await exportCsv();
      setToast({ type: 'success', message: 'transactions.csv downloaded' });
    } catch {
      setToast({ type: 'error', message: 'Could not export the CSV file.' });
    }
  }

  return (
    <>
      <div className="space-y-6">
        <Header
          title="Transactions"
          subtitle="Every expense and every income in one ledger, newest first"
        />

        <PageTabs tabs={TRANSACTION_TABS} />

        {!userId && (
          <EmptyState
            variant="error"
            title="Not signed in"
            description="You need to be signed in to see your transaction history."
          />
        )}

        {userId && status === 'loading' && <TransactionSkeleton />}

        {userId && status === 'error' && (
          <EmptyState
            variant="error"
            title="Something went wrong"
            description={errorMessage ?? 'Please try again in a moment.'}
            actionLabel="Retry"
            onAction={reload}
          />
        )}

        {/* First-run state: nothing recorded anywhere yet, so there is nothing
            to filter and the filter bar would only be noise. */}
        {userId &&
          status === 'success' &&
          !filtersActive &&
          mode === 'history' &&
          totalElements === 0 && (
            <EmptyState
              icon={<ArrowLeftRight className="h-7 w-7 text-brand-blue" />}
              title="No transactions yet"
              description="This ledger is built from your expenses and income — add one in the Expense or Income module and it will appear here automatically."
            />
          )}

        {userId &&
          status === 'success' &&
          (filtersActive || mode === 'search' || totalElements > 0) && (
            <>
              {
                /*
 * Hides these tiles during deep search instead of recalculating them.
 * The tiles show filtered ledger totals, while deep search only searches expenses.
 */
              }
              {mode === 'history' && (
                <TransactionStats rows={allMatching} total={totalElements} />
              )}

              <TransactionFilterBar
                sort={sort}
                exporting={exporting}
                searching={searching}
                onApply={applyFilters}
                onSortChange={changeSort}
                onExport={handleExport}
                onDeepSearch={runDeepSearch}
              />

              {mode === 'search' && (
                <div className="glass-card flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-3">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-purple" />
                    <div>
                      <p className="text-sm font-semibold text-navy-900">
                        Showing deep search results, not the filtered ledger
                      </p>
                      {searchError ? (
                       
                        <div className="mt-1 space-y-2">
                          <p className="text-sm text-red-500">{searchError}</p>
                          <p className="text-xs text-navy-700/60">
                            Deep search needs a one-time index on the expenses
                            table. Run this once against your database, then try
                            again:
                          </p>
                          <code className="block overflow-x-auto rounded-xl border border-sky-200 bg-white/70 px-3 py-2 text-[11px] text-navy-800">
                            ALTER TABLE expenses ADD FULLTEXT INDEX
                            ft_expense_search (merchant, notes);
                          </code>
                        </div>
                      ) : (
                        <p className="mt-1 text-sm text-navy-700/65">
                          Filters, sorting and paging do not apply while a deep
                          search is open.
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    icon={<X className="h-4 w-4" />}
                    onClick={exitDeepSearch}
                    className="shrink-0"
                  >
                    Back to History
                  </Button>
                </div>
              )}


              {mode === 'history' ? (
                <TransactionTable
                  rows={pageItems}
                  heading="Transaction History"
                  note="Read-only — edit a row in the Expense or Income module it came from."
                  emptyText="No transactions match these filters."
                  page={page}
                  totalPages={totalPages}
                  totalElements={totalElements}
                  busy={busy}
                  onPageChange={goToPage}
                />
              ) : (
                !searchError && (
                  <TransactionTable
                    rows={searchResults}
                    heading={`Deep search: “${searchTerm}”`}
                    note="Expenses only — matched on merchant and notes."
                    emptyText="No expense mentions that text in its merchant or notes."
                    page={0}
                    /* A List, not a Page — there is nothing to page through. */
                    totalPages={0}
                    totalElements={searchResults.length}
                    busy={searching}
                    onPageChange={goToPage}
                  />
                )
              )}
            </>
          )}

      </div>

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </>
  );
}

/** Matches the real layout's shape so the page doesn't jump when data lands. */
function TransactionSkeleton() {
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
      <div className="glass-card h-32" />
      <div className="glass-card h-80" />
    </div>
  );
}
