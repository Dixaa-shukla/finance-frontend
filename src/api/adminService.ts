import { axiosClient } from '@/api/axiosClient';
import type { CategoryRequest, CategoryResponse, CategoryType } from '@/types/category';
import type {
  AdminPageResponse,
  AiUsageLogResponse,
  AiUsageSummaryResponse,
  ApiEnvelope,
  PlatformAnalyticsResponse,
  PlatformReportResponse,
  UserDetailResponse,
  UserSummaryResponse,
} from '@/types/admin';

/**
 * Client for /api/v1/admin/**.
 *
 * Admin responses need an extra .data to get the actual DTO.
 * Non-admin users get 403, so they do not have admin access.
 */
export const adminService = {
  // ---------- users ----------

  /** size is clamped to 100 server-side (MAX_PAGE_SIZE); sort is fixed. */
  async getUsers(page = 0, size = 20): Promise<AdminPageResponse<UserSummaryResponse>> {
    const { data } = await axiosClient.get<
      ApiEnvelope<AdminPageResponse<UserSummaryResponse>>
    >('/admin/users', { params: { page, size } });
    return data.data;
  },

  /** 404 when that userId has no profile row — an account can exist without one. */
  async getUserDetail(userId: number): Promise<UserDetailResponse> {
    const { data } = await axiosClient.get<ApiEnvelope<UserDetailResponse>>(
      `/admin/users/${userId}`
    );
    return data.data;
  },

  // ---------- analytics & reports ----------

  async getAnalytics(): Promise<PlatformAnalyticsResponse> {
    const { data } = await axiosClient.get<ApiEnvelope<PlatformAnalyticsResponse>>(
      '/admin/analytics'
    );
    return data.data;
  },

  /** Combines analytics and AI usage data into one snapshot with the time it was generated. */
  async getReport(): Promise<PlatformReportResponse> {
    const { data } = await axiosClient.get<ApiEnvelope<PlatformReportResponse>>(
      '/admin/reports'
    );
    return data.data;
  },

  // ---------- AI usage ----------

  async getAiUsage(): Promise<AiUsageSummaryResponse> {
    const { data } = await axiosClient.get<ApiEnvelope<AiUsageSummaryResponse>>(
      '/admin/ai-usage'
    );
    return data.data;
  },

  async getAiUsageLogs(
    page = 0,
    size = 20
  ): Promise<AdminPageResponse<AiUsageLogResponse>> {
    const { data } = await axiosClient.get<
      ApiEnvelope<AdminPageResponse<AiUsageLogResponse>>
    >('/admin/ai-usage/logs', { params: { page, size } });
    return data.data;
  },

  // ---------- default categories ----------

  /** Creates a system-wide category (userId IS NULL), visible to every user. */
  async createDefaultCategory(payload: CategoryRequest): Promise<CategoryResponse> {
    const { data } = await axiosClient.post<ApiEnvelope<CategoryResponse>>(
      '/admin/categories/defaults',
      payload
    );
    return data.data;
  },

  async getDefaultCategories(type?: CategoryType | null): Promise<CategoryResponse[]> {
    const { data } = await axiosClient.get<ApiEnvelope<CategoryResponse[]>>(
      '/admin/categories/defaults',
      // Dropped when falsy: a blank string is not a valid CategoryType.
      { params: type ? { type } : undefined }
    );
    return data.data;
  },

  /** Works on any category, default or custom. */
  async updateCategory(
    id: number,
    payload: CategoryRequest
  ): Promise<CategoryResponse> {
    const { data } = await axiosClient.put<ApiEnvelope<CategoryResponse>>(
      `/admin/categories/${id}`,
      payload
    );
    return data.data;
  },

  /**
   * Force-delete, including defaults that the user, so nothing is unwrapped here.
   */
  async deleteCategory(id: number): Promise<void> {
    await axiosClient.delete(`/admin/categories/${id}`);
  },
};
