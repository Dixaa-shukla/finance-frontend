import { axiosClient } from '@/api/axiosClient';
import type {
  CategoryOption,
  CategoryRequest,
  CategoryResponse,
  CategoryType,
} from '@/types/category';


export const categoryService = {
  /**
   * GET /api/v1/categories/user/{userId}?type=INCOME
 * Returns the default categories and the user's custom categories,
 * already sorted by name. The optional type is sent only when a valid value
 * is provided, never as an empty string.
 */
   
  getForUser: async (
    userId: number,
    type?: CategoryType
  ): Promise<CategoryResponse[]> => {
    const { data } = await axiosClient.get<CategoryResponse[]>(
      `/categories/user/${userId}`,
      { params: type ? { type } : undefined }
    );
    return data;
  },

  /** GET /api/v1/categories/defaults?type=INCOME — the shared categories only. */
  getDefaults: async (type?: CategoryType): Promise<CategoryOption[]> => {
    const { data } = await axiosClient.get<CategoryOption[]>(
      '/categories/defaults',
      { params: type ? { type } : undefined }
    );
    return data;
  },

  /** GET /api/v1/categories/{id} */
  getById: async (id: number): Promise<CategoryResponse> => {
    const { data } = await axiosClient.get<CategoryResponse>(
      `/categories/${id}`
    );
    return data;
  },

  /**
   * POST /api/v1/categories/custom/user/{userId} — 201 Created.
   */
  createCustom: async (
    userId: number,
    payload: CategoryRequest
  ): Promise<CategoryResponse> => {
    const { data } = await axiosClient.post<CategoryResponse>(
      `/categories/custom/user/${userId}`,
      payload
    );
    return data;
  },

  /** POST /api/v1/categories/defaults — 201. ADMIN ONLY (403 otherwise). */
  createDefault: async (
    payload: CategoryRequest
  ): Promise<CategoryResponse> => {
    const { data } = await axiosClient.post<CategoryResponse>(
      '/categories/defaults',
      payload
    );
    return data;
  },

  /** PUT /api/v1/categories/{id} — replaces name, type, icon and colorHex. */
  update: async (
    id: number,
    payload: CategoryRequest
  ): Promise<CategoryResponse> => {
    const { data } = await axiosClient.put<CategoryResponse>(
      `/categories/${id}`,
      payload
    );
    return data;
  },

  /**
   * DELETE /api/v1/categories/{id} — 204 No Content.
   */
  remove: async (id: number): Promise<void> => {
    await axiosClient.delete(`/categories/${id}`);
  },

  /**
   * DELETE /api/v1/categories/admin/{id} — 204. ADMIN ONLY (403 otherwise).
   * Force-deletes anything, defaults included.
   */
  removeAsAdmin: async (id: number): Promise<void> => {
    await axiosClient.delete(`/categories/admin/${id}`);
  },
};
