import { axiosClient } from '@/api/axiosClient';
import type {
  PageResponse,
  TransactionFilters,
  TransactionResponse,
} from '@/types/transaction';

function toParams(filters: TransactionFilters): Record<string, string> {
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value !== '') params[key] = value;
  }
  return params;
}

/**
 * How many rows the summary tiles are allowed to add.
 */
export const SUMMARY_PAGE_SIZE = 1000;

export const transactionService = {
  /** GET /api/v1/transactions/user/{userId} — one filtered, sorted page. */
  getHistory: async (
    userId: number,
    filters: TransactionFilters,
    page: number,
    sort: string,
    size = 15
  ): Promise<PageResponse<TransactionResponse>> => {
    const { data } = await axiosClient.get<PageResponse<TransactionResponse>>(
      `/transactions/user/${userId}`,
      { params: { ...toParams(filters), page, size, sort } }
    );
    return data;
  },

  /**
   * The same route again, asking for everything that matches, so the tiles can
   * report the real money-in/money-out for the filter.
   */
  getAllMatching: async (
    userId: number,
    filters: TransactionFilters,
    sort: string
  ): Promise<PageResponse<TransactionResponse>> => {
    const { data } = await axiosClient.get<PageResponse<TransactionResponse>>(
      `/transactions/user/${userId}`,
      { params: { ...toParams(filters), page: 0, size: SUMMARY_PAGE_SIZE, sort } }
    );
    return data;
  },

  /**
   * GET /api/v1/transactions/user/{userId}/export — a CSV file as byte[].
   */
  exportCsv: async (
    userId: number,
    filters: TransactionFilters
  ): Promise<Blob> => {
    const { data } = await axiosClient.get<Blob>(
      `/transactions/user/${userId}/export`,
      { params: toParams(filters), responseType: 'blob' }
    );
    return data;
  },

  /**
   * GET /api/v1/transactions/user/{userId}/fulltext-search — a plain List, not a
   * Page, so there is nothing to page through.
   */
  fullTextSearch: async (
    userId: number,
    q: string
  ): Promise<TransactionResponse[]> => {
    const { data } = await axiosClient.get<TransactionResponse[]>(
      `/transactions/user/${userId}/fulltext-search`,
      { params: { q } }
    );
    return data;
  },
};

/**
 * Saves the exported data as a file.
 * Revokes the temporary URL afterward to free memory and prevent memory leaks.
 */
export function saveBlobAsFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
