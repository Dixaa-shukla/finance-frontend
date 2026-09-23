import { useCallback, useEffect, useMemo, useState } from 'react';
import { recurringService } from '@/api/recurringService';
import { extractErrorMessage, getCurrentUserId } from '@/api/axiosClient';
import { todayISO } from '@/utils/format';
import type {
  RecurringScope,
  RecurringTransactionRequest,
  RecurringTransactionResponse,
} from '@/types/recurring';

type Status = 'loading' | 'success' | 'error';

/** An active rule that the nightly job would normally pick up. */
export function isOverdue(rule: RecurringTransactionResponse): boolean {
  return rule.active && rule.nextDueDate <= todayISO();
}

/**
 * Module 9 — Recurring Transactions. One request feeds this screen:
 *
 *   GET /recurring-transactions/user/{userId}  -> every rule, active and paused.
 */
export function useRecurring() {
  const userId = getCurrentUserId();

  const [status, setStatus] = useState<Status>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rules, setRules] = useState<RecurringTransactionResponse[]>([]);
  const [busy, setBusy] = useState(false);

  const [scope, setScope] = useState<RecurringScope>('ALL');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await recurringService.getByUserId(userId);
      // Soonest due first; paused rules sink to the bottom whatever their date,
      // because a paused rule's nextDueDate is frozen and means nothing.
      setRules(
        [...data].sort((a, b) => {
          if (a.active !== b.active) return a.active ? -1 : 1;
          return a.nextDueDate.localeCompare(b.nextDueDate);
        })
      );
      setStatus('success');
      setErrorMessage(null);
    } catch (err) {
      setStatus('error');
      setErrorMessage(
        extractErrorMessage(err, 'Could not load your recurring rules.')
      );
    } finally {
      setBusy(false);
    }
  }, [userId]);

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  /** What the grid renders. All three filters run in the browser. */
  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rules.filter((rule) => {
      if (scope === 'ACTIVE' && !rule.active) return false;
      if (scope === 'PAUSED' && rule.active) return false;
      if (scope === 'OVERDUE' && !isOverdue(rule)) return false;
      if (typeFilter && rule.type !== typeFilter) return false;
      if (term && !rule.title.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [rules, scope, typeFilter, search]);

  /** Drives the sweep banner: the sweep would act on these right now. */
  const overdueRules = useMemo(() => rules.filter(isOverdue), [rules]);

  // ---------- actions, all called from event handlers ----------

  async function reload() {
    setBusy(true);
    await load();
  }

  async function createRule(payload: RecurringTransactionRequest) {
    const created = await recurringService.create(payload);
    await reload();
    return created;
  }

  async function updateRule(id: number, payload: RecurringTransactionRequest) {
    const updated = await recurringService.update(id, payload);
    await reload();
    return updated;
  }

 /**
 * Pause and resume use separate PATCH routes, so the endpoint is chosen
 * based on the rule's current state instead of sending an active value.
 */
  async function toggleActive(rule: RecurringTransactionResponse) {
    const updated = rule.active
      ? await recurringService.pause(rule.id)
      : await recurringService.resume(rule.id);
    await reload();
    return updated;
  }

  async function deleteRule(id: number) {
    await recurringService.remove(id);
    await reload();
  }

  /**
 * Runs the same process as the 01:00 scheduled job.
 * The returned count is for all users, not just the current user.
 */
  async function processDue() {
    const result = await recurringService.processDue();
    await reload();
    return result;
  }

  return {
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
  };
}


