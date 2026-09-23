import { useCallback, useEffect, useState } from 'react';
import { saveBlobAsFile, transactionService } from '@/api/transactionService';
import { extractErrorMessage, getCurrentUserId } from '@/api/axiosClient';
import {
  DEFAULT_TRANSACTION_SORT,
  EMPTY_TRANSACTION_FILTERS,
  type TransactionFilters,
  type TransactionResponse,
} from '@/types/transaction';

type Status = 'loading' | 'success' | 'error';

/** 'history' = the paged ledger. 'search' = the fulltext route's flat result. */
type Mode = 'history' | 'search';

/**
 * Module 8 — Transaction Management.
 *
 * Reads GET /transactions/user/{userId} TWICE per filter change, on purpose:
 *   size=15   -> the rows the table shows.
 *   size=1000 -> every matching row, which is what the four tiles total.
 */
export function useTransactions() {
  const userId = getCurrentUserId();

  const [status, setStatus] = useState<Status>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [allMatching, setAllMatching] = useState<TransactionResponse[]>([]);
  const [pageItems, setPageItems] = useState<TransactionResponse[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [busy, setBusy] = useState(false);

  const [filters, setFilters] = useState<TransactionFilters>(
    EMPTY_TRANSACTION_FILTERS
  );
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState(DEFAULT_TRANSACTION_SORT);

  const [mode, setMode] = useState<Mode>('history');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<TransactionResponse[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [exporting, setExporting] = useState(false);

  // ---------- every matching row: the four summary tiles ----------
  const loadSummary = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await transactionService.getAllMatching(userId, filters, sort);
      setAllMatching(data.content);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMessage(
        extractErrorMessage(err, 'Could not load your transaction history.')
      );
    }
  }, [userId, filters, sort]);

  useEffect(() => {
    (async () => {
      await loadSummary();
    })();
  }, [loadSummary]);

  // ---------- one page: the table ----------
  const loadPage = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await transactionService.getHistory(
        userId,
        filters,
        page,
        sort
      );
      setPageItems(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err) {
      setErrorMessage(
        extractErrorMessage(err, 'Could not load your transaction history.')
      );
    } finally {
      setBusy(false);
    }
  }, [userId, filters, page, sort]);

  useEffect(() => {
    (async () => {
      await loadPage();
    })();
  }, [loadPage]);

  // ---------- actions, all called from event handlers ----------

  function applyFilters(next: TransactionFilters) {
    setBusy(true);
    setPage(0); // a different filter makes the old page number meaningless
    setFilters(next);
    // Applying a filter is an explicit "show me the ledger again" gesture.
    setMode('history');
  }

  function changeSort(next: string) {
    setBusy(true);
    setPage(0); // page 3 of oldest-first is not page 3 of newest-first
    setSort(next);
  }

  function goToPage(next: number) {
    setBusy(true);
    setPage(next);
  }

  async function reload() {
    setBusy(true);
    await Promise.all([loadSummary(), loadPage()]);
  }

  // The full-text search is a separate option, so it runs only when the user
// chooses it instead of being part of the normal page loading.
  async function runDeepSearch(term: string) {
    if (!userId) return;
    const q = term.trim();
    if (!q) return;

    setSearching(true);
    setSearchError(null);
    setSearchTerm(q);
    setMode('search');
    try {
      setSearchResults(await transactionService.fullTextSearch(userId, q));
    } catch (err) {
      setSearchResults([]);
      /*
 * If  MySQL FULLTEXT index is missing, the backend returns 500, so the message tells the user
 * what needs to be fixed instead of showing a generic error.
 */
      setSearchError(
        extractErrorMessage(
          err,
          'Deep search is not available yet — the expenses table still needs its FULLTEXT index.'
        )
      );
    } finally {
      setSearching(false);
    }
  }

  function exitDeepSearch() {
    setMode('history');
    setSearchTerm('');
    setSearchResults([]);
    setSearchError(null);
  }

  /**
 * Downloads a CSV using the filters currently applied on the page.
 * It exports all matching rows, not just the current.
 */
  async function exportCsv() {
    if (!userId) return;
    setExporting(true);
    try {
      const blob = await transactionService.exportCsv(userId, filters);
      saveBlobAsFile(blob, 'transactions.csv');
    } finally {
      setExporting(false);
    }
  }

  return {
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
  };
}
