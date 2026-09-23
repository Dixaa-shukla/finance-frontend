import { axiosClient } from '@/api/axiosClient';
import type { BudgetOverviewResponse, ChartResponse, DashboardSummaryResponse } from '@/types/dashboard';

/** Direct client for the existing /dashboard backend controller. */
export const dashboardService = {
  async summary(userId: number): Promise<DashboardSummaryResponse> { const { data } = await axiosClient.get<DashboardSummaryResponse>(`/dashboard/summary/${userId}`); return data; },
  async expenseByCategory(userId: number): Promise<ChartResponse> { const { data } = await axiosClient.get<ChartResponse>(`/dashboard/expense-chart/${userId}`, { params: { groupBy: 'CATEGORY' } }); return data; },
  async savingsReport(userId: number): Promise<ChartResponse> { const { data } = await axiosClient.get<ChartResponse>(`/dashboard/savings-report/${userId}`, { params: { months: 6 } }); return data; },
  async budgetOverview(userId: number): Promise<BudgetOverviewResponse> { const { data } = await axiosClient.get<BudgetOverviewResponse>(`/dashboard/budget-overview/${userId}`); return data; },
};
