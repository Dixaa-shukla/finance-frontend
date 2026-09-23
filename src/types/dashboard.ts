import type { BudgetResponse } from '@/types/budget';

export interface DashboardSummaryResponse {
  userId: number;
  totalIncomeThisMonth: number;
  totalExpenseThisMonth: number;
  netSavingsThisMonth: number;
  healthScore: number;
  healthScoreLabel: string;
  activeBudgetsCount: number;
  triggeredBudgetAlertsCount: number;
  activeGoalsCount: number;
  goalsNearingDeadlineOrExpiredCount: number;
  totalInvestmentValue: number;
  totalInvestmentGainLoss: number;
  unreadNotificationsCount: number;
}

export interface ChartDataset { label: string; data: number[]; }
export interface ChartResponse { labels: string[]; datasets: ChartDataset[]; }

export interface BudgetOverviewResponse {
  totalBudgeted: number;
  totalSpent: number;
  overallPercentUsed: number;
  budgets: BudgetResponse[];
}
