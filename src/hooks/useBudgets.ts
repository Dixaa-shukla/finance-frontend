import { useCallback, useEffect, useMemo, useState } from 'react';
import { budgetService } from '@/api/budgetService';
import { categoryService } from '@/api/categoryService';
import { extractErrorMessage, getCurrentUserId } from '@/api/axiosClient';
import type { CategoryOption } from '@/types/category';
import type {
  BudgetPeriodScope,
  BudgetRequest,
  BudgetResponse,
} from '@/types/budget';

type Status = 'loading' | 'success' | 'error';

/**
 * Module 6 — Budget Planner. Two requests feed this screen:
 *
 *   GET /budgets/user/{userId}          -> every budget, each already carrying its
 *                                         live spentAmount / percentUsed /
 *                                         alertTriggered from the server.
 *   GET /categories/user/{userId}
 *       ?type=EXPENSE                   -> the options for the optional categoryId
 *                                         on the form. EXPENSE only, because
 *                                         BudgetServiceImpl.validateCategory 400s
 *                                         on anything else.

 */
export function useBudgets() {
  const userId = getCurrentUserId();

  const [status, setStatus] = useState<Status>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [budgets, setBudgets] = useState<BudgetResponse[]>([]);
  const [busy, setBusy] = useState(false);

  const [categories, setCategories] = useState<CategoryOption[]>([]);

  const [scope, setScope] = useState<BudgetPeriodScope>('ALL');
  const [alertsOnly, setAlertsOnly] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await budgetService.getByUserId(userId);
      setBudgets(data);
      setStatus('success');
      setErrorMessage(null);
    } catch (err) {
      setStatus('error');
      setErrorMessage(extractErrorMessage(err, 'Could not load your budgets.'));
    } finally {
      setBusy(false);
    }
  }, [userId]);

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  const loadCategories = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await categoryService.getForUser(userId, 'EXPENSE');
      setCategories(data);
    } catch {
      // A failed category fetch must not take the page down: categoryId is
      // optional, so the form falls back to overall budgets only.
      setCategories([]);
    }
  }, [userId]);

  useEffect(() => {
    (async () => {
      await loadCategories();
    })();
  }, [loadCategories]);

  /** What the grid renders. */
  const visible = useMemo(() => {
    return budgets.filter((budget) => {
      if (scope !== 'ALL' && budget.period !== scope) return false;
      if (alertsOnly && !budget.alertTriggered) return false;
      return true;
    });
  }, [budgets, scope, alertsOnly]);

  // ---------- actions, all called from event handlers ----------

  async function reload() {
    setBusy(true);
    await load();
  }

  async function createBudget(payload: BudgetRequest) {
    const created = await budgetService.create(payload);
    await reload();
    return created;
  }

  async function updateBudget(id: number, payload: BudgetRequest) {
    const updated = await budgetService.update(id, payload);
    await reload();
    return updated;
  }

  async function deleteBudget(id: number) {
    await budgetService.remove(id);
    await reload();
  }

  return {
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
  };
}
