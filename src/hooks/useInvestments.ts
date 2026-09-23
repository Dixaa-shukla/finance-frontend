import { useCallback, useEffect, useMemo, useState } from 'react';
import { investmentService } from '@/api/investmentService';
import { extractErrorMessage, getCurrentUserId } from '@/api/axiosClient';
import type {
  InvestmentRequest,
  InvestmentResponse,
  InvestmentSummaryResponse,
  InvestmentType,
} from '@/types/investment';

type Status = 'loading' | 'success' | 'error';

/**
 * Module 10 — Investment Tracker. Two requests feed this screen:
 *
 *   GET /investments/user/{userId}?type=...   -> the rows, filtered server-side
 *   GET /investments/user/{userId}/summary    -> whole-portfolio totals
 */
export function useInvestments() {
  const userId = getCurrentUserId();

  const [status, setStatus] = useState<Status>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [investments, setInvestments] = useState<InvestmentResponse[]>([]);
  const [summary, setSummary] = useState<InvestmentSummaryResponse | null>(null);
  const [busy, setBusy] = useState(false);

  const [typeFilter, setTypeFilter] = useState<InvestmentType | ''>('');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      // Both in flight together: neither depends on the other's result.
      const [rows, totals] = await Promise.all([
        investmentService.getByUserId(userId, typeFilter || null),
        investmentService.getSummary(userId),
      ]);
      setInvestments(rows);
      setSummary(totals);
      setStatus('success');
      setErrorMessage(null);
    } catch (err) {
      setStatus('error');
      setErrorMessage(
        extractErrorMessage(err, 'Could not load your portfolio.')
      );
    } finally {
      setBusy(false);
    }
  }, [userId, typeFilter]);

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  /** Name search only — the backend has no equivalent route. */
  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return investments;
    return investments.filter((item) =>
      item.name.toLowerCase().includes(term)
    );
  }, [investments, search]);

 /**
 * Gets the count for each category type from the summary.
 * The loaded list is already filtered, so counting it would give incorrect totals.
 */
  const countsByType = useMemo(() => {
    const map = {} as Record<InvestmentType, number>;
    for (const row of summary?.breakdownByType ?? []) {
      map[row.type] = row.count;
    }
    return map;
  }, [summary]);

  /** Holdings whose maturity date has passed — the server computes `matured`. */
  const maturedCount = useMemo(
    () => investments.filter((item) => item.matured).length,
    [investments]
  );

  // ---------- actions, all called from event handlers ----------

  async function reload() {
    setBusy(true);
    await load();
  }

  async function createInvestment(payload: InvestmentRequest) {
    const created = await investmentService.create(payload);
    await reload();
    return created;
  }

  async function updateInvestment(id: number, payload: InvestmentRequest) {
    const updated = await investmentService.update(id, payload);
    await reload();
    return updated;
  }

  async function deleteInvestment(id: number) {
    await investmentService.remove(id);
    await reload();
  }

  return {
    userId,
    status,
    errorMessage,
    investments,
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
  };
}
