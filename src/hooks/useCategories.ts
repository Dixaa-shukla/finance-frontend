import { useCallback, useEffect, useMemo, useState } from 'react';
import { categoryService } from '@/api/categoryService';
import { extractErrorMessage, getCurrentUserId } from '@/api/axiosClient';
import type {
  CategoryRequest,
  CategoryResponse,
  CategoryScope,
} from '@/types/category';

type Status = 'loading' | 'success' | 'error';

/**
 * Module 5 — Category Management.
 *
 * ONE request feeds this whole screen:
 *   GET /categories/user/{userId}
 */
export function useCategories() {
  const userId = getCurrentUserId();

  const [status, setStatus] = useState<Status>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [busy, setBusy] = useState(false);

  const [scope, setScope] = useState<CategoryScope>('ALL');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await categoryService.getForUser(userId);
      setCategories(data);
      setStatus('success');
      setErrorMessage(null);
    } catch (err) {
      setStatus('error');
      setErrorMessage(
        extractErrorMessage(err, 'Could not load your categories.')
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

  /**
 * Shows the categories after applying the selected type and name search.
 * The search is case-insensitive and matches part of the category name.
 */
  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return categories.filter((category) => {
      if (scope !== 'ALL' && category.type !== scope) return false;
      if (term && !category.name.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [categories, scope, search]);

  // ---------- actions, all called from event handlers ----------

  async function reload() {
    setBusy(true);
    await load();
  }

  /** POST /categories/custom/user/{userId} — the ordinary user's create. */
  async function createCustom(payload: CategoryRequest) {
    if (!userId) throw new Error('No signed-in user.');
    const created = await categoryService.createCustom(userId, payload);
    await reload();
    return created;
  }

  /**
   * POST /categories/defaults — ADMIN ONLY, 403 otherwise.
   */
  async function createDefault(payload: CategoryRequest) {
    const created = await categoryService.createDefault(payload);
    await reload();
    return created;
  }

  async function updateCategory(id: number, payload: CategoryRequest) {
    const updated = await categoryService.update(id, payload);
    await reload();
    return updated;
  }

  /**
 * Chooses the delete route based on the category type.
 * Default categories need the admin endpoint, while custom categories use the normal route.
 */
  async function deleteCategory(category: CategoryResponse) {
    if (category.default) {
      await categoryService.removeAsAdmin(category.id);
    } else {
      await categoryService.remove(category.id);
    }
    await reload();
  }

  return {
    userId,
    status,
    errorMessage,
    categories,
    visible,
    busy,
    scope,
    search,
    setScope,
    setSearch,
    reload,
    createCustom,
    createDefault,
    updateCategory,
    deleteCategory,
  };
}
