import { useCallback, useEffect, useState } from 'react';
import { expenseService } from '@/api/expenseService';
import { extractErrorMessage, getCurrentUserId } from '@/api/axiosClient';
import {
  EMPTY_FILTERS,
  type ExpenseFilters,
  type ExpenseRequest,
  type ExpenseResponse,
} from '@/types/expense';

type Status = 'loading' | 'success' | 'error';

/**
 * Loads Module 3 (Expense Management) from two backend routes, on purpose:
 *
 *   GET /expenses/user/{userId}         -> the complete list, which is what the
 *                                         summary cards and the category
 *                                         breakdown are calculated from.
 *   GET /expenses/user/{userId}/search  -> one filtered, paged slice, which is
 *                                         what the table shows.
 */
export function useExpenses() {
  const userId = getCurrentUserId();

  const [status, setStatus] = useState<Status>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [allExpenses, setAllExpenses] = useState<ExpenseResponse[]>([]);

  const [pageItems, setPageItems] = useState<ExpenseResponse[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [busy, setBusy] = useState(false);

  const [filters, setFilters] = useState<ExpenseFilters>(EMPTY_FILTERS);
  const [page, setPage] = useState(0);

  // ---------- full list: summary cards + category breakdown ----------
  const loadAll = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await expenseService.getByUserId(userId);
      setAllExpenses(data);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMessage(extractErrorMessage(err, 'Could not load your expenses.'));
    }
  }, [userId]);

  useEffect(() => {
    (async () => {
      await loadAll();
    })();
  }, [loadAll]);

  // ---------- one filtered page: the table ----------
  const loadPage = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await expenseService.search(userId, filters, page);
      setPageItems(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err) {
      setErrorMessage(extractErrorMessage(err, 'Could not load your expenses.'));
    } finally {
      setBusy(false);
    }
  }, [userId, filters, page]);

  useEffect(() => {
    (async () => {
      await loadPage();
    })();
  }, [loadPage]);

  // ---------- actions, all called from event handlers ----------

  function applyFilters(next: ExpenseFilters) {
    setBusy(true);
    setPage(0); // a different filter makes the old page number meaningless
    setFilters(next);
  }

  function goToPage(next: number) {
    setBusy(true);
    setPage(next);
  }

  /** Re-reads both routes from the server after a change. */
  async function reload() {
    await Promise.all([loadAll(), loadPage()]);
  }

  async function createExpense(payload: ExpenseRequest) {
    const created = await expenseService.create(payload);
    await reload();
    return created;
  }

  async function updateExpense(id: number, payload: ExpenseRequest) {
    const updated = await expenseService.update(id, payload);
    await reload();
    return updated;
  }

  async function deleteExpense(id: number) {
    await expenseService.remove(id);
    await loadAll();

    // Deleting the only row on page 3 would otherwise leave an empty table.
    if (pageItems.length === 1 && page > 0) {
      setPage(page - 1); // changing the page makes the effect refetch 
    } else {
      await loadPage();
    }
  }

  return {
    userId,
    status,
    errorMessage,
    allExpenses,
    pageItems,
    totalPages,
    totalElements,
    page,
    filters,
    busy,
    applyFilters,
    goToPage,
    reload,
    createExpense,
    updateExpense,
    deleteExpense,
  };
}
