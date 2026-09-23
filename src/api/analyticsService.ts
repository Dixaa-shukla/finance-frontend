import { axiosClient } from '@/api/axiosClient';
import type { HealthScoreResponse, MonthlyReportResponse, OverspendingAlertResponse, SpendingTrendResponse } from '@/types/analytics';

export const analyticsService = {
  async healthScore(userId: number): Promise<HealthScoreResponse> { const { data } = await axiosClient.get<HealthScoreResponse>(`/ai/spending-analytics/health-score/${userId}`); return data; },
  async trends(userId: number, months = 6): Promise<SpendingTrendResponse> { const { data } = await axiosClient.get<SpendingTrendResponse>(`/ai/spending-analytics/trends/${userId}`, { params: { months } }); return data; },
  async overspending(userId: number): Promise<OverspendingAlertResponse[]> { const { data } = await axiosClient.get<OverspendingAlertResponse[]>(`/ai/spending-analytics/overspending/${userId}`); return data; },
  async getReport(userId: number, month: string): Promise<MonthlyReportResponse> { const { data } = await axiosClient.get<MonthlyReportResponse>(`/ai/spending-analytics/monthly-report/${userId}`, { params: { month } }); return data; },
  async generateReport(userId: number, month: string): Promise<MonthlyReportResponse> { const { data } = await axiosClient.post<MonthlyReportResponse>(`/ai/spending-analytics/monthly-report/${userId}`, undefined, { params: { month } }); return data; },
};
