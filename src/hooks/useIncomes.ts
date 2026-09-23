import { useCallback, useEffect, useState } from 'react';
import { incomeService } from '@/api/incomeService';
import { categoryService } from '@/api/categoryService';
import { extractErrorMessage, getCurrentUserId } from '@/api/axiosClient';
import type { CategoryOption } from '@/types/category';
import {
  EMPTY_INCOME_FILTERS,
  type IncomeFilters,
  type IncomeRequest,
  type IncomeResponse,
} from '@/types/income';

type Status = 'loading' | 'success' | 'error';

/**
 * Loads Module 4 (Income Management) from three backend routes, on purpose:
 *
 *   GET /incomes/user/{userId}         -> the complete list, which is what the
 *                                        summary cards and the source
 *                                        breakdown are calculated from.
 *   GET /incomes/user/{userId}/search  -> one filtered, paged slice, which is
 *                                        what the table shows.
 *   GET /categories/user/{userId}
 *       ?type=INCOME                   -> the options for the optional
 *                                        categoryId field on the form.
 */
export function useIncomes() {
  const userId = getCurrentUserId();

  const [status, setStatus] = useState<Status>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [allIncomes, setAllIncomes] = useState<IncomeResponse[]>([]);

  const [pageItems, setPageItems] = useState<IncomeResponse[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [busy, setBusy] = useState(false);

  const [categories, setCategories] = useState<CategoryOption[]>([]);

  const [filters, setFilters] = useState<IncomeFilters>(EMPTY_INCOME_FILTERS);
  const [page, setPage] = useState(0);

  // ---------- full list: summary cards + source breakdown ----------
  const loadAll = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await incomeService.getByUserId(userId);
      setAllIncomes(data);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMessage(extractErrorMessage(err, 'Could not load your income.'));
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
      const data = await incomeService.search(userId, filters, page);
      setPageItems(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err) {
      setErrorMessage(extractErrorMessage(err, 'Could not load your income.'));
    } finally {
      setBusy(false);
    }
  }, [userId, filters, page]);

  useEffect(() => {
    (async () => {
      await loadPage();
    })();
  }, [loadPage]);

  // ---------- INCOME categories: the form's optional category picker ----------
  const loadCategories = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await categoryService.getForUser(userId, 'INCOME');
      setCategories(data);
    } catch {
      // A failed category fetch must not take the page down: categoryId is
      // optional on IncomeRequest, so the form simply offers no picker.
      setCategories([]);
    }
  }, [userId]);

  useEffect(() => {
    (async () => {
      await loadCategories();
    })();
  }, [loadCategories]);

  // ---------- actions, all called from event handlers ----------

  function applyFilters(next: IncomeFilters) {
    setBusy(true);
    setPage(0); // a different filter makes the old page number meaningless
    setFilters(next);
  }

  function goToPage(next: number) {
    setBusy(true);
    setPage(next);
  }

  /** Re-reads both income routes from the server after a change. */
  async function reload() {
    await Promise.all([loadAll(), loadPage()]);
  }

  async function createIncome(payload: IncomeRequest) {
    const created = await incomeService.create(payload);
    await reload();
    return created;
  }

  async function updateIncome(id: number, payload: IncomeRequest) {
    const updated = await incomeService.update(id, payload);
    await reload();
    return updated;
  }

  async function deleteIncome(id: number) {
    await incomeService.remove(id);
    await loadAll();

    // Deleting the only row on page 3 would otherwise leave an empty table.
    if (pageItems.length === 1 && page > 0) {
      setPage(page - 1); // changing the page makes the effect refetch for us
    } else {
      await loadPage();
    }
  }

  return {
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
  };
}
