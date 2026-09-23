export interface HealthScoreResponse { userId: number; score: number; label: string; savingsRatePercent: number; savingsScoreOutOf40: number; budgetAdherencePercent: number; budgetScoreOutOf30: number; goalOnTrackPercent: number; goalScoreOutOf30: number; }
export interface MonthlySpendingBreakdown { month: string; totalAmount: number; byCategory: Record<string, number>; }
export interface SpendingTrendResponse { userId: number; months: MonthlySpendingBreakdown[]; }
export interface OverspendingAlertResponse { category: string; currentMonthAmount: number; historicalAverageAmount: number; percentAboveAverage: number; }
export interface MonthlyReportResponse { id: number; userId: number; month: string; totalIncome: number; totalExpense: number; savingsAmount: number; savingsRatePercent: number; healthScore: number; healthScoreLabel: string; aiInsight: string; generatedAt: string; }
