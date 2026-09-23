import { useCallback, useEffect, useMemo, useState } from 'react';
import { goalService } from '@/api/goalService';
import { extractErrorMessage, getCurrentUserId } from '@/api/axiosClient';
import type {
  GoalContributionRequest,
  GoalRequest,
  GoalResponse,
  GoalStatusScope,
} from '@/types/goal';

type Status = 'loading' | 'success' | 'error';

/**
 * Module 7 — Financial Goals. One request feeds this screen:
 *
 *   GET /goals/user/{userId}  -> every goal, each already carrying its live
 *                               remainingAmount / progressPercent /
 *                               daysRemaining / status / suggestedMonthlySaving.
 */
export function useGoals() {
  const userId = getCurrentUserId();

  const [status, setStatus] = useState<Status>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [goals, setGoals] = useState<GoalResponse[]>([]);
  const [busy, setBusy] = useState(false);

  const [scope, setScope] = useState<GoalStatusScope>('ALL');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await goalService.getByUserId(userId);
      setGoals(data);
      setStatus('success');
      setErrorMessage(null);
    } catch (err) {
      setStatus('error');
      setErrorMessage(extractErrorMessage(err, 'Could not load your goals.'));
    } finally {
      setBusy(false);
    }
  }, [userId]);

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  /** What the grid renders. */
  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return goals.filter((goal) => {
      if (scope !== 'ALL' && goal.status !== scope) return false;
      if (term && !goal.title.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [goals, scope, search]);

  // ---------- actions, all called from event handlers ----------

  async function reload() {
    setBusy(true);
    await load();
  }

  async function createGoal(payload: GoalRequest) {
    const created = await goalService.create(payload);
    await reload();
    return created;
  }

  async function updateGoal(id: number, payload: GoalRequest) {
    const updated = await goalService.update(id, payload);
    await reload();
    return updated;
  }

  /** Adds to currentAmount. There is no route that takes anything back off. */
  async function contribute(id: number, payload: GoalContributionRequest) {
    const updated = await goalService.contribute(id, payload);
    await reload();
    return updated;
  }

  async function deleteGoal(id: number) {
    await goalService.remove(id);
    await reload();
  }

  return {
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
  };
}
