import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BellRing,
  CalendarDays,
  HeartPulse,
  Lightbulb,
  PiggyBank,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
  WalletCards,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Link } from 'react-router';
import { dashboardService } from '@/api/dashboardService';
import { expenseService } from '@/api/expenseService';
import { goalService } from '@/api/goalService';
import { profileService } from '@/api/profileService';
import { recurringService } from '@/api/recurringService';
import { transactionService } from '@/api/transactionService';
import { extractErrorMessage, getCurrentUserId } from '@/api/axiosClient';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDate, formatINR } from '@/utils/format';
import type {
  BudgetOverviewResponse,
  ChartResponse,
  DashboardSummaryResponse,
} from '@/types/dashboard';
import type { ExpenseResponse } from '@/types/expense';
import type { GoalResponse } from '@/types/goal';
import type { RecurringTransactionResponse } from '@/types/recurring';
import type { TransactionResponse } from '@/types/transaction';

/**
 * Module 14 — Dashboard.
 */
type Status = 'loading' | 'success' | 'error';

const COLORS = ['#477bf0', '#866bf7', '#42c7df', '#83acf7', '#b09cf8', '#22b07d'];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function DashboardPage() {
  const userId = getCurrentUserId();
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [categories, setCategories] = useState<ChartResponse | null>(null);
  const [trend, setTrend] = useState<ChartResponse | null>(null);
  const [budget, setBudget] = useState<BudgetOverviewResponse | null>(null);
  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [goals, setGoals] = useState<GoalResponse[]>([]);
  const [recurring, setRecurring] = useState<RecurringTransactionResponse[]>([]);
  const [expenses, setExpenses] = useState<ExpenseResponse[]>([]);
  const [firstName, setFirstName] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setStatus('loading');
    try {
      const [a, b, c, d, e, f, g, h, profile] = await Promise.all([
        dashboardService.summary(userId),
        dashboardService.expenseByCategory(userId),
        dashboardService.savingsReport(userId),
        dashboardService.budgetOverview(userId),
        transactionService.getHistory(
          userId,
          { type: '', category: '', startDate: '', endDate: '', minAmount: '', maxAmount: '' },
          0,
          'transactionDate,desc',
          5
        ),
        goalService.getByUserId(userId),
        recurringService.getByUserId(userId),
        expenseService.getByUserId(userId),
        // Greeting only — a missing profile is a 404, never a dashboard failure.
        profileService.getByUserId(userId).catch(() => null),
      ]);
      setSummary(a);
      setCategories(b);
      setTrend(c);
      setBudget(d);
      setTransactions(e.content);
      setGoals(f);
      setRecurring(g);
      setExpenses(h);
      setFirstName(profile?.fullName?.trim().split(/\s+/)[0] ?? null);
      setError(null);
      setStatus('success');
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not load your dashboard.'));
      setStatus('error');
    }
  }, [userId]);

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  const categoryData = useMemo(
    () =>
      categories?.labels
        .map((name, index) => ({
          name,
          value: Number(categories.datasets[0]?.data[index] ?? 0),
        }))
        .filter((entry) => entry.value > 0) ?? [],
    [categories]
  );

  const trendData = useMemo(
    () =>
      trend?.labels.map((month, index) => ({
        month: shortMonth(month),
        ...Object.fromEntries(
          trend.datasets.map((set) => [set.label, Number(set.data[index] ?? 0)])
        ),
      })) ?? [],
    [trend]
  );

  /** The savings report's raw series, used for the sparklines and the deltas. */
  const series = useCallback(
    (label: string) =>
      trend?.datasets.find((set) => set.label === label)?.data.map(Number) ?? [],
    [trend]
  );

  const totalSpent = categoryData.reduce((sum, entry) => sum + entry.value, 0);
  const activeGoals = goals.filter((goal) => goal.status === 'IN_PROGRESS');
  const reminders = recurring
    .filter((item) => item.active)
    .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate))
    .slice(0, 3);

  return (
    <div className="space-y-5">
      <Header
        title={`Good ${partOfDay()}${firstName ? `, ${firstName}` : ''}! 👋`}
        subtitle="Here's your AI-powered financial overview"
        action={
          <span className="glass-card hidden items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-navy-800 sm:inline-flex">
            <CalendarDays className="h-4 w-4 text-brand-blue" />
            {monthRangeLabel()}
          </span>
        }
      />

      {!userId && (
        <EmptyState
          variant="error"
          title="Not signed in"
          description="Sign in to view your financial dashboard."
        />
      )}
      {userId && status === 'loading' && <Skeleton />}
      {userId && status === 'error' && (
        <EmptyState
          variant="error"
          title="Could not load dashboard"
          description={error ?? 'Please try again.'}
          actionLabel="Retry"
          onAction={load}
        />
      )}

      {userId && status === 'success' && summary && (
        <>
          {/* ---------- 1. Summary cards ---------- */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={<TrendingUp className="h-[18px] w-[18px]" />}
              tint="tint-blue"
              chip="bg-sky-100 text-brand-blue"
              label="Total Income"
              value={formatINR(summary.totalIncomeThisMonth)}
              spark={series('Income')}
              sparkColor="#477bf0"
              change={momChange(series('Income'))}
              goodWhen="up"
            />
            <StatCard
              icon={<WalletCards className="h-[18px] w-[18px]" />}
              tint="tint-purple"
              chip="bg-lavender-100 text-brand-purple"
              label="Total Expenses"
              value={formatINR(summary.totalExpenseThisMonth)}
              spark={series('Expense')}
              sparkColor="#866bf7"
              change={momChange(series('Expense'))}
              goodWhen="down"
            />
            <StatCard
              icon={<PiggyBank className="h-[18px] w-[18px]" />}
              tint="tint-mint"
              chip="bg-mint-100 text-brand-green"
              label="Savings"
              value={formatINR(summary.netSavingsThisMonth)}
              spark={series('Savings')}
              sparkColor="#22b07d"
              change={momChange(series('Savings'))}
              goodWhen="up"
            />
            <StatCard
              icon={<HeartPulse className="h-[18px] w-[18px]" />}
              tint="tint-cyan"
              chip="bg-sky-100 text-brand-cyan"
              label="Finance Score"
              value={`${summary.healthScore}`}
              suffix="/ 100"
              note={summary.healthScoreLabel}
              /* No series exists for the score, so it gets a real gauge bar. */
              meter={summary.healthScore}
            />
          </section>

          {/* ---------- 2. Spending overview + monthly trend ---------- */}
          <section className="grid gap-4 xl:grid-cols-5">
            <Card className="xl:col-span-2" title="Spending Overview" right="This Month">
              {categoryData.length ? (
                <div className="flex h-[250px] items-center gap-2">
                  <div className="relative h-full w-1/2">
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={categoryData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius="60%"
                          outerRadius="88%"
                          paddingAngle={3}
                          stroke="none"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => formatINR(Number(value ?? 0))}
                          contentStyle={TOOLTIP_STYLE}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Total sits in the ring's hole, as in the reference design. */}
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <b className="text-base font-extrabold text-navy-900">
                        {formatINR(totalSpent)}
                      </b>
                      <span className="text-[10px] font-semibold text-navy-700/50">
                        Total
                      </span>
                    </div>
                  </div>
                  <div className="w-1/2 space-y-2.5 overflow-y-auto pr-1">
                    {categoryData.map((entry, index) => (
                      <div key={entry.name} className="flex items-center gap-2 text-[11px]">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="min-w-0 flex-1 truncate font-semibold text-navy-700">
                          {entry.name}
                        </span>
                        <span className="font-extrabold text-navy-900">
                          {formatINR(entry.value)}
                        </span>
                        <span className="w-9 text-right text-navy-700/50">
                          {totalSpent ? ((entry.value / totalSpent) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <Blank text="Add expenses to see category spending." />
              )}
            </Card>

            <Card className="xl:col-span-3" title="Monthly Trend" right="Last 6 months">
              {trendData.length ? (
                <>
                  <div className="mb-1 flex flex-wrap items-center gap-4">
                    {trend?.datasets.map((set, index) => (
                      <span
                        key={set.label}
                        className="flex items-center gap-1.5 text-[11px] font-semibold text-navy-700/70"
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        {set.label}
                      </span>
                    ))}
                  </div>
                  <div className="h-[228px]">
                    <ResponsiveContainer>
                      <AreaChart data={trendData} margin={{ left: -14, right: 6, top: 6 }}>
                        <defs>
                          {trend?.datasets.map((set, index) => (
                            <linearGradient
                              key={set.label}
                              id={`trend-${index}`}
                              x1="0"
                              x2="0"
                              y1="0"
                              y2="1"
                            >
                              <stop
                                offset="0"
                                stopColor={COLORS[index % COLORS.length]}
                                stopOpacity="0.22"
                              />
                              <stop
                                offset="1"
                                stopColor={COLORS[index % COLORS.length]}
                                stopOpacity="0"
                              />
                            </linearGradient>
                          ))}
                        </defs>
                        <CartesianGrid vertical={false} stroke="#dce7fa" strokeDasharray="4 4" />
                        <XAxis
                          dataKey="month"
                          tickLine={false}
                          axisLine={false}
                          tick={AXIS_TICK}
                          dy={6}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tick={AXIS_TICK}
                          tickFormatter={compactINR}
                          width={54}
                        />
                        <Tooltip
                          formatter={(value) => formatINR(Number(value ?? 0))}
                          contentStyle={TOOLTIP_STYLE}
                        />
                        {trend?.datasets.map((set, index) => (
                          <Area
                            key={set.label}
                            type="monotone"
                            dataKey={set.label}
                            stroke={COLORS[index % COLORS.length]}
                            strokeWidth={2.5}
                            fill={`url(#trend-${index})`}
                            dot={{
                              r: 3,
                              fill: '#fff',
                              stroke: COLORS[index % COLORS.length],
                              strokeWidth: 2,
                            }}
                            activeDot={{ r: 5 }}
                          />
                        ))}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </>
              ) : (
                <Blank text="Your trend will appear as you record income and expenses." />
              )}
            </Card>
          </section>

          {/* ---------- 3. Transactions + budgets + top categories ---------- */}
          <section className="grid gap-4 xl:grid-cols-7">
            <Card className="xl:col-span-2" title="Recent Transactions" link="/transactions">
              {transactions.length ? (
                <div className="divide-y divide-sky-100/80">
                  {transactions.map((item) => (
                    <Link
                      key={`${item.type}-${item.sourceId}`}
                      to={item.type === 'EXPENSE' ? '/expenses' : '/income'}
                      className="flex items-center gap-3 py-3 transition-opacity hover:opacity-75"
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          item.type === 'INCOME'
                            ? 'bg-mint-100 text-brand-green'
                            : 'bg-lavender-100 text-brand-purple'
                        }`}
                      >
                        {item.type === 'INCOME' ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-extrabold text-navy-800">
                          {item.description ?? item.category}
                        </span>
                        <span className="block text-[10px] text-navy-700/55">
                          {item.category} · {formatDate(item.transactionDate)}
                        </span>
                      </span>
                      <span
                        className={`shrink-0 text-xs font-extrabold ${
                          item.type === 'INCOME' ? 'text-brand-green' : 'text-navy-800'
                        }`}
                      >
                        {item.type === 'INCOME' ? '+' : '−'}
                        {formatINR(item.amount)}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <Blank text="No transactions yet." small />
              )}
            </Card>

            <Card className="xl:col-span-2" title="Budget Status" link="/budgets">
              {budget?.budgets.length ? (
                <div className="space-y-4">
                  {budget.budgets.slice(0, 4).map((item) => {
                    const pct = Math.min(100, Math.max(0, item.percentUsed));
                    return (
                      <div key={item.id}>
                        <div className="flex justify-between text-xs font-bold text-navy-800">
                          <span className="truncate">{item.categoryName ?? 'Overall Budget'}</span>
                          <span className="shrink-0 pl-2">{pct.toFixed(0)}%</span>
                        </div>
                        <p className="mt-1 text-[10px] text-navy-700/55">
                          {formatINR(item.spentAmount)} / {formatINR(item.amount)}
                        </p>
                        <div className="mt-2 h-2 rounded-pill bg-sky-100">
                          <span
                            className={`block h-full rounded-pill ${
                              item.alertTriggered
                                ? 'bg-gradient-to-r from-rose-400 to-rose-500'
                                : 'bg-gradient-to-r from-brand-blue to-brand-cyan'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {/* Whole-portfolio figure straight from the overview endpoint. */}
                  <div className="flex items-center justify-between rounded-xl bg-sky-50/80 px-3 py-2">
                    <span className="text-[11px] font-bold text-navy-700/70">
                      Overall Budget
                    </span>
                    <span className="rounded-pill bg-white px-2.5 py-1 text-[11px] font-extrabold text-brand-blue">
                      {budget.overallPercentUsed.toFixed(0)}%
                    </span>
                  </div>
                </div>
              ) : (
                <Blank text="Create a budget to track progress." small />
              )}
            </Card>

            <Card className="xl:col-span-3" title="Top Categories" right="This Month">
              {categoryData.length ? (
                <div className="space-y-2.5">
                  {categoryData.slice(0, 6).map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-3">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold"
                        style={{
                          backgroundColor: `${COLORS[index % COLORS.length]}1f`,
                          color: COLORS[index % COLORS.length],
                        }}
                      >
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-bold text-navy-800">
                          {entry.name}
                        </span>
                        <span className="mt-1.5 block h-1.5 rounded-pill bg-sky-100">
                          <span
                            className="block h-full rounded-pill"
                            style={{
                              width: `${totalSpent ? (entry.value / totalSpent) * 100 : 0}%`,
                              backgroundColor: COLORS[index % COLORS.length],
                            }}
                          />
                        </span>
                      </span>
                      <span className="shrink-0 text-xs font-extrabold text-navy-900">
                        {totalSpent ? ((entry.value / totalSpent) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <Blank text="Categories will appear here." small />
              )}
            </Card>
          </section>

          {/* ---------- 4. AI insights + health score ---------- */}
          <section className="grid gap-4 xl:grid-cols-5">
            <Card className="xl:col-span-3" title="AI Insights for You">
              <div className="grid gap-3 md:grid-cols-3">
                <Insight
                  icon={<Lightbulb className="h-4 w-4" />}
                  tint="bg-lavender-100/70"
                  chip="bg-white text-brand-purple"
                  titleClass="text-brand-purple"
                  title="Spending Alert"
                  text={
                    summary.triggeredBudgetAlertsCount
                      ? `${summary.triggeredBudgetAlertsCount} budget alert${
                          summary.triggeredBudgetAlertsCount > 1 ? 's' : ''
                        } need attention.`
                      : 'No budget alerts right now.'
                  }
                  to="/budgets"
                />
                <Insight
                  icon={<PiggyBank className="h-4 w-4" />}
                  tint="bg-mint-100/70"
                  chip="bg-white text-brand-green"
                  titleClass="text-brand-green"
                  title="Saving Opportunity"
                  text={
                    summary.netSavingsThisMonth >= 0
                      ? `You have saved ${formatINR(summary.netSavingsThisMonth)} this month.`
                      : 'Review expenses to improve savings.'
                  }
                  to="/ai-analytics"
                />
                <Insight
                  icon={<Target className="h-4 w-4" />}
                  tint="bg-sky-100/80"
                  chip="bg-white text-brand-blue"
                  titleClass="text-brand-blue"
                  title="Goal Progress"
                  text={
                    activeGoals.length
                      ? `${activeGoals.length} active goal${
                          activeGoals.length > 1 ? 's' : ''
                        } in progress.`
                      : 'Create a goal to begin tracking progress.'
                  }
                  to="/goals"
                />
              </div>
            </Card>

            <Card className="xl:col-span-2" title="Financial Health Score">
              <div className="flex items-center gap-4">
                <Score score={summary.healthScore} />
                <div className="min-w-0 flex-1">
                  <CubeArt />
                  <p className="mt-2 text-xs leading-relaxed text-navy-700/65">
                    <b className="text-navy-900">{summary.healthScoreLabel}.</b> Calculated
                    from your own income, spending and savings data.
                  </p>
                  <Link
                    to="/ai-analytics"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-extrabold text-brand-blue"
                  >
                    View analytics
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </Card>
          </section>

          {/* ---------- 5. Heatmap + reminders ---------- */}
          <section className="grid gap-4 xl:grid-cols-5">
            <Card className="xl:col-span-3" title="Expenses Heatmap" right="This Month">
              <Heatmap expenses={expenses} />
            </Card>

            <Card className="xl:col-span-2" title="Upcoming Reminders" link="/recurring">
              {reminders.length ? (
                <div className="space-y-2.5">
                  {reminders.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-2xl bg-sky-50/80 p-3"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-lavender-100 text-brand-purple">
                        <CalendarDays className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-extrabold text-navy-800">
                          {item.title}
                        </span>
                        <span className="block text-[10px] text-navy-700/55">
                          Due {formatDate(item.nextDueDate)}
                        </span>
                      </span>
                      <BellRing className="h-4 w-4 shrink-0 text-brand-blue" />
                    </div>
                  ))}
                </div>
              ) : (
                <Blank text="No active recurring reminders." small />
              )}
            </Card>
          </section>

          {/* ---------- 6. Closing call to action ---------- */}
          <section className="dashboard-cta glass-card relative flex flex-col gap-5 overflow-hidden p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
            <div className="relative z-10">
              <p className="text-lg font-extrabold text-navy-900">
                Take Control of Your Finances
              </p>
              <p className="mt-1 text-sm text-navy-700/65">Track. Plan. Save. Achieve.</p>
            </div>
            <Link to="/expenses" className="relative z-10">
              <Button icon={<Plus className="h-4 w-4" />}>Add Expense</Button>
            </Link>
            <p className="relative z-10 max-w-[15rem] text-sm text-navy-700/65">
              Let Nova AI help you build a better financial future.
            </p>
            <GlobeArt />
          </section>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ shared */

const TOOLTIP_STYLE = {
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,.8)',
  background: 'rgba(255,255,255,.95)',
  boxShadow: '0 12px 32px -8px rgba(59,111,224,.24)',
  fontSize: 11,
  fontWeight: 600,
} as const;

const AXIS_TICK = { fontSize: 10, fill: '#1E2B5E', opacity: 0.55 } as const;

/** 1,25,000 -> "1.3L"; 50000 -> "50K". Keeps the y-axis narrow. */
function compactINR(value: number): string {
  if (Math.abs(value) >= 100000) return `${(value / 100000).toFixed(1)}L`;
  if (Math.abs(value) >= 1000) return `${Math.round(value / 1000)}K`;
  return String(value);
}

function partOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}

/** "May 1 – May 31, 2025" for the month the summary figures cover. */
function monthRangeLabel(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const fmt = (date: Date) =>
    date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}, ${end.getFullYear()}`;
}

/**
 * Percentage change of the newest month against the one before it.
 * Returns null when there is nothing honest to report: fewer than two months of
 * data, or a zero baseline (any change from zero is an infinite percentage).
 */
function momChange(data: number[]): number | null {
  if (data.length < 2) return null;
  const previous = data[data.length - 2];
  const current = data[data.length - 1];
  if (previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function shortMonth(value: string): string {
  const date = new Date(`${value}-01T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-IN', { month: 'short' });
}

/* -------------------------------------------------------------- components */

function Card({
  title,
  right,
  link,
  children,
  className = '',
}: {
  title: string;
  right?: string;
  link?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`glass-card overflow-hidden p-5 sm:p-6 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-extrabold text-navy-900">{title}</h2>
        {link ? (
          <Link
            to={link}
            className="rounded-pill bg-sky-50 px-3 py-1.5 text-[10px] font-extrabold text-brand-blue transition-colors hover:bg-sky-100"
          >
            View All
          </Link>
        ) : (
          right && (
            <span className="rounded-pill bg-sky-50 px-3 py-1.5 text-[10px] font-bold text-navy-700/70">
              {right}
            </span>
          )
        )}
      </div>
      {children}
    </section>
  );
}

/**
 * One of the four summary cards.
 */
function StatCard({
  icon,
  tint,
  chip,
  label,
  value,
  suffix,
  note,
  spark,
  sparkColor,
  change,
  goodWhen,
  meter,
}: {
  icon: React.ReactNode;
  tint: string;
  chip: string;
  label: string;
  value: string;
  suffix?: string;
  note?: string;
  spark?: number[];
  sparkColor?: string;
  change?: number | null;
  goodWhen?: 'up' | 'down';
  meter?: number;
}) {
  const rising = (change ?? 0) >= 0;
  const good = goodWhen === 'down' ? !rising : rising;

  return (
    <div className={`glass-card ${tint} p-5`}>
      <div className="flex items-center gap-3">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${chip}`}>
          {icon}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-bold text-navy-700/70">{label}</p>
          <p className="mt-0.5 flex items-baseline gap-1 text-[22px] font-extrabold leading-tight tracking-tight text-navy-900">
            <span className="truncate">{value}</span>
            {suffix && (
              <span className="text-xs font-bold text-navy-700/50">{suffix}</span>
            )}
          </p>
        </div>
      </div>

      {change !== null && change !== undefined ? (
        <p className="mt-3 flex items-center gap-1 text-[11px] font-semibold">
          <span
            className={`flex items-center gap-0.5 ${
              good ? 'text-brand-green' : 'text-rose-500'
            }`}
          >
            {rising ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
            {Math.abs(change).toFixed(1)}%
          </span>
          <span className="text-navy-700/50">vs last month</span>
        </p>
      ) : (
        <p className="mt-3 text-[11px] font-semibold text-navy-700/50">
          {note ?? 'No previous month to compare'}
        </p>
      )}

      {meter !== undefined ? (
        <span className="mt-3 block h-2 rounded-pill bg-white/70">
          <span
            className="block h-full rounded-pill bg-gradient-to-r from-brand-cyan to-brand-blue"
            style={{ width: `${Math.max(0, Math.min(100, meter))}%` }}
          />
        </span>
      ) : (
        spark && sparkColor && <Sparkline data={spark} color={sparkColor} />
      )}
    </div>
  );
}

/**
 * A tiny trend line drawn straight from the savings report's series.
 *
 * Hand-rolled SVG rather than a chart component: it has no axes, no tooltip and
 * no legend, so a charting library would cost far more than the eight lines here.
 * vectorEffect keeps the stroke 2px wide despite the non-uniform viewBox scaling.
 */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 26 - ((value - min) / span) * 22;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg
      viewBox="0 0 100 30"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="mt-3 h-8 w-full"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function Insight({
  icon,
  tint,
  chip,
  titleClass,
  title,
  text,
  to,
}: {
  icon: React.ReactNode;
  tint: string;
  chip: string;
  titleClass: string;
  title: string;
  text: string;
  to: string;
}) {
  return (
    <div className={`rounded-2xl border border-white/70 p-4 ${tint}`}>
      <div className="flex items-center gap-2">
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${chip}`}>
          {icon}
        </span>
        <p className={`text-xs font-extrabold ${titleClass}`}>{title}</p>
      </div>
      <p className="mt-2.5 min-h-10 text-[11px] leading-relaxed text-navy-700/70">{text}</p>
      <Link
        to={to}
        className="mt-2 inline-flex items-center gap-1 text-[11px] font-extrabold text-brand-blue"
      >
        View details
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

function Score({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(score, 100));
  return (
    <div
      className="relative flex h-[116px] w-[116px] shrink-0 items-center justify-center rounded-full"
      style={{
        background: `conic-gradient(#42c7df 0deg, #477bf0 ${clamped * 3.6}deg, #e2ebfb ${clamped * 3.6}deg)`,
      }}
    >
      <div className="flex h-[88px] w-[88px] flex-col items-center justify-center rounded-full bg-white shadow-soft">
        <b className="text-[26px] font-extrabold leading-none text-navy-900">{score}</b>
        <span className="mt-0.5 text-[9px] font-bold text-navy-700/55">of 100</span>
      </div>
    </div>
  );
}

/**
 * Isometric glass cube with three faces and matching gradients.
 * It is decorative, so it is hidden from screen readers.
 */
function CubeArt() {
  return (
    <div aria-hidden="true" className="relative h-14 w-14">
      <span className="absolute inset-0 rounded-full bg-brand-purple/25 blur-xl" />
      <span
        className="absolute inset-0 bg-gradient-to-b from-white to-lavender-200"
        style={{ clipPath: 'polygon(50% 0%, 100% 27%, 50% 54%, 0% 27%)' }}
      />
      <span
        className="absolute inset-0 bg-gradient-to-b from-brand-purple/55 to-brand-blue/70"
        style={{ clipPath: 'polygon(0% 27%, 50% 54%, 50% 100%, 0% 73%)' }}
      />
      <span
        className="absolute inset-0 bg-gradient-to-b from-brand-sky/50 to-brand-cyan/60"
        style={{ clipPath: 'polygon(100% 27%, 100% 73%, 50% 100%, 50% 54%)' }}
      />
      <Sparkles className="absolute -right-1 -top-1 h-3.5 w-3.5 text-brand-cyan" />
    </div>
  );
}

/** Wireframe globe closing the CTA banner. Ornamental → aria-hidden. */
function GlobeArt() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 200 200"
      className="pointer-events-none absolute -bottom-14 -right-10 h-56 w-56 text-brand-blue/25"
    >
      <defs>
        <radialGradient id="globeFill" cx="35%" cy="30%">
          <stop offset="0%" stopColor="#8fb6f7" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#7B6EF6" stopOpacity="0.08" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="72" fill="url(#globeFill)" />
      <g fill="none" stroke="currentColor" strokeWidth="1.4">
        <circle cx="100" cy="100" r="72" />
        <ellipse cx="100" cy="100" rx="30" ry="72" />
        <ellipse cx="100" cy="100" rx="56" ry="72" />
        <ellipse cx="100" cy="100" rx="72" ry="26" />
        <ellipse cx="100" cy="100" rx="72" ry="52" />
      </g>
    </svg>
  );
}

/**
 * Shows this month's spending in a calendar-style grid with weekdays and weeks.
 * Each date is placed under its correct weekday, matching the reference design.
 */
function Heatmap({ expenses }: { expenses: ExpenseResponse[] }) {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  // Monday-first weekday index of the 1st (JS getDay() is Sunday-first).
  const firstWeekday = (new Date(now.getFullYear(), now.getMonth(), 1).getDay() + 6) % 7;
  const weekCount = Math.ceil((firstWeekday + daysInMonth) / 7);

  const totals = new Map<number, number>();
  expenses
    .filter((item) => item.expenseDate.startsWith(monthKey))
    .forEach((item) => {
      const day = Number(item.expenseDate.slice(8, 10));
      totals.set(day, (totals.get(day) ?? 0) + item.amount);
    });
  const max = Math.max(...totals.values(), 1);

  return (
    <div>
      {/* Day-number ruler: the first date shown in each week column. */}
      <div
        className="mb-1 grid gap-1 pl-8 text-[9px] font-semibold text-navy-700/45"
        style={{ gridTemplateColumns: `repeat(${weekCount}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: weekCount }, (_, week) => (
          <span key={week}>{Math.max(1, week * 7 - firstWeekday + 1)}</span>
        ))}
      </div>

      <div className="space-y-1">
        {WEEKDAYS.map((label, weekday) => (
          <div key={label} className="flex items-center gap-1">
            <span className="w-7 shrink-0 text-[9px] font-semibold text-navy-700/45">
              {label}
            </span>
            <div
              className="grid flex-1 gap-1"
              style={{ gridTemplateColumns: `repeat(${weekCount}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: weekCount }, (_, week) => {
                const day = week * 7 + weekday - firstWeekday + 1;
                if (day < 1 || day > daysInMonth) {
                  return <span key={week} className="h-5 rounded-md" />;
                }
                const amount = totals.get(day) ?? 0;
                return (
                  <span
                    key={week}
                    title={`${label} ${day} · ${formatINR(amount)}`}
                    className="h-5 rounded-md transition-transform hover:scale-110"
                    style={{
                      backgroundColor: amount
                        ? `rgba(71,123,240,${0.2 + 0.8 * (amount / max)})`
                        : 'rgba(220,231,250,.75)',
                    }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between text-[10px] font-semibold text-navy-700/45">
        <span>Hover a day for its total</span>
        <span className="flex items-center gap-1.5">
          Low
          {[0.2, 0.4, 0.6, 0.8, 1].map((step) => (
            <span
              key={step}
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: `rgba(71,123,240,${step})` }}
            />
          ))}
          High
        </span>
      </div>
    </div>
  );
}

function Blank({ text, small = false }: { text: string; small?: boolean }) {
  return (
    <p
      className={`flex items-center justify-center text-center text-sm text-navy-700/55 ${
        small ? 'min-h-32' : 'h-[250px]'
      }`}
    >
      {text}
    </p>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card h-[168px]" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-5">
        <div className="glass-card h-80 xl:col-span-2" />
        <div className="glass-card h-80 xl:col-span-3" />
      </div>
      <div className="grid gap-4 xl:grid-cols-7">
        <div className="glass-card h-64 xl:col-span-2" />
        <div className="glass-card h-64 xl:col-span-2" />
        <div className="glass-card h-64 xl:col-span-3" />
      </div>
    </div>
  );
}
