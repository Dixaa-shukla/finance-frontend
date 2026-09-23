import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BrainCircuit, RefreshCw, Sparkles, Target, WalletCards } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip } from 'recharts';
import { analyticsService } from '@/api/analyticsService';
import { extractErrorMessage, getCurrentUserId } from '@/api/axiosClient';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { Toast, type ToastState } from '@/components/common/Toast';
import { formatINR } from '@/utils/format';
import type { HealthScoreResponse, MonthlyReportResponse, OverspendingAlertResponse, SpendingTrendResponse } from '@/types/analytics';

function previousMonth() { const date = new Date(); date.setMonth(date.getMonth() - 1); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; }

export default function AiAnalyticsPage() {
  const userId = getCurrentUserId();
  const [health, setHealth] = useState<HealthScoreResponse | null>(null);
  const [trends, setTrends] = useState<SpendingTrendResponse | null>(null);
  const [alerts, setAlerts] = useState<OverspendingAlertResponse[]>([]);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [month, setMonth] = useState(previousMonth());
  const [report, setReport] = useState<MonthlyReportResponse | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setStatus('loading');
    try {
      const [nextHealth, nextTrends, nextAlerts] = await Promise.all([analyticsService.healthScore(userId), analyticsService.trends(userId), analyticsService.overspending(userId)]);
      setHealth(nextHealth); setTrends(nextTrends); setAlerts(nextAlerts); setStatus('success'); setError(null);
    } catch (err) { setStatus('error'); setError(extractErrorMessage(err, 'Could not load spending analytics.')); }
  }, [userId]);
  useEffect(() => { (async () => { await load(); })(); }, [load]);
  useEffect(() => { (async () => { if (!userId) return; setReportLoading(true); try { setReport(await analyticsService.getReport(userId, month)); } catch { setReport(null); } finally { setReportLoading(false); } })(); }, [userId, month]);

  const trendChart = useMemo(() => trends?.months.map((item) => ({ month: new Date(`${item.month}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'short' }), spending: item.totalAmount })) ?? [], [trends]);
  const categoryChart = useMemo(() => { const values = new Map<string, number>(); trends?.months.forEach((item) => Object.entries(item.byCategory).forEach(([name, amount]) => values.set(name, (values.get(name) ?? 0) + amount))); return [...values.entries()].map(([category, amount]) => ({ category, amount })); }, [trends]);

  async function generate() { if (!userId) return; setGenerating(true); try { const next = await analyticsService.generateReport(userId, month); setReport(next); setToast({ type: 'success', message: `AI report for ${month} generated.` }); } catch (err) { setToast({ type: 'error', message: extractErrorMessage(err, 'Could not generate the AI report.') }); } finally { setGenerating(false); } }

  return <><div className="space-y-6"><Header title="Reports" subtitle="Understand your habits, spot overspending, and get a monthly AI financial review" />
    {!userId && <EmptyState variant="error" title="Not signed in" description="You need to be signed in to use spending analytics." />}
    {userId && status === 'loading' && <AnalyticsSkeleton />}
    {userId && status === 'error' && <EmptyState variant="error" title="Could not load analytics" description={error ?? 'Please try again.'} actionLabel="Retry" onAction={load} />}
    {userId && status === 'success' && health && <>
      <section className="grid gap-4 lg:grid-cols-3"><div className="glass-card flex flex-col items-center justify-center p-6 text-center"><div className="relative flex h-32 w-32 items-center justify-center rounded-full" style={{ background: `conic-gradient(#3b6fe0 ${health.score * 3.6}deg, #dce9fb 0deg)` }}><div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white/90"><span className="text-3xl font-extrabold text-navy-900">{health.score}</span><span className="text-[10px] font-bold text-navy-700/55">out of 100</span></div></div><h2 className="mt-4 text-base font-extrabold text-navy-900">Financial health: {health.label}</h2><p className="mt-1 text-xs text-navy-700/60">Updated from your current saved data</p></div><ScoreCard icon={<WalletCards />} title="Savings rate" score={health.savingsRatePercent} detail={`${health.savingsScoreOutOf40.toFixed(1)} / 40 points`} color="blue" /><ScoreCard icon={<Target />} title="Goal progress" score={health.goalOnTrackPercent} detail={`${health.goalScoreOutOf30.toFixed(1)} / 30 points`} color="purple" /></section>
      <section className="grid gap-4 xl:grid-cols-5"><div className="glass-card p-5 xl:col-span-3"><h2 className="text-sm font-extrabold text-navy-900">Spending trend</h2><p className="mt-1 text-xs text-navy-700/55">Your total expense amount over the last six months</p>{trendChart.some((item) => item.spending) ? <div className="mt-5 h-60"><ResponsiveContainer><AreaChart data={trendChart} margin={{ left: -15, right: 5 }}><defs><linearGradient id="spendingFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#7b6ef6" stopOpacity={.34} /><stop offset="100%" stopColor="#7b6ef6" stopOpacity={.02} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#dce7fa" strokeDasharray="4 4" /><Tooltip formatter={(value) => formatINR(Number(value ?? 0))} /><Area type="monotone" dataKey="spending" name="Spending" stroke="#7b6ef6" strokeWidth={2.5} fill="url(#spendingFill)" /></AreaChart></ResponsiveContainer></div> : <ChartEmpty text="Add expenses to start seeing your spending trend." />}</div><div className="glass-card p-5 xl:col-span-2"><h2 className="text-sm font-extrabold text-navy-900">Overspending alerts</h2><p className="mt-1 text-xs text-navy-700/55">Categories above your historical average</p><div className="mt-4 space-y-3">{alerts.length ? alerts.map((alert) => <div key={alert.category} className="rounded-xl bg-rose-50/70 p-3"><div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-rose-500" /><span className="text-xs font-extrabold text-navy-800">{alert.category}</span></div><p className="mt-2 text-[11px] text-navy-700/65">{formatINR(alert.currentMonthAmount)} this month — <strong className="text-rose-500">{alert.percentAboveAverage.toFixed(0)}% above</strong> your {formatINR(alert.historicalAverageAmount)} average.</p></div>) : <ChartEmpty text="No categories are above your usual spend." />}</div></div></section>
      <section className="grid gap-4 xl:grid-cols-5"><div className="glass-card p-5 xl:col-span-2"><h2 className="text-sm font-extrabold text-navy-900">Category performance</h2><p className="mt-1 text-xs text-navy-700/55">Six-month total by expense category</p>{categoryChart.length ? <div className="mt-5 h-64"><ResponsiveContainer><LineChart data={categoryChart} layout="vertical" margin={{ left: 15, right: 15 }}><CartesianGrid horizontal={false} stroke="#dce7fa" /><Tooltip formatter={(value) => formatINR(Number(value ?? 0))} /><Legend /><Line dataKey="amount" name="Total spent" stroke="#3b6fe0" strokeWidth={2.5} /></LineChart></ResponsiveContainer></div> : <ChartEmpty text="Category data will appear here." />}</div><div className="glass-card p-5 xl:col-span-3"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-sm font-extrabold text-navy-900">AI monthly report</h2><p className="mt-1 text-xs text-navy-700/55">A saved month-by-month review generated from your finance data</p></div><div className="flex items-center gap-2"><input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="rounded-xl border border-sky-200 bg-white/70 px-3 py-2 text-xs font-semibold text-navy-700" /><Button icon={<RefreshCw className="h-4 w-4" />} loading={generating} onClick={generate}>Generate report</Button></div></div>{reportLoading ? <div className="mt-5 h-44 animate-pulse rounded-2xl bg-sky-50" /> : report ? <Report report={report} /> : <div className="mt-5 flex min-h-44 flex-col items-center justify-center rounded-2xl bg-sky-50/70 p-6 text-center"><BrainCircuit className="h-7 w-7 text-brand-purple" /><p className="mt-3 text-sm font-bold text-navy-800">No report saved for {month}</p><p className="mt-1 text-xs text-navy-700/55">Generate a report to receive an AI narrative and a monthly financial snapshot.</p></div>}</div></section>
    </>}</div><Toast toast={toast} onDismiss={() => setToast(null)} /></>;
}

function ScoreCard({ icon, title, score, detail, color }: { icon: React.ReactNode; title: string; score: number; detail: string; color: 'blue' | 'purple' }) { return <div className="glass-card p-6"><span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${color === 'blue' ? 'bg-sky-100 text-brand-blue' : 'bg-lavender-100 text-brand-purple'}`}>{icon}</span><p className="mt-4 text-xs font-bold text-navy-700">{title}</p><p className="mt-1 text-2xl font-extrabold text-navy-900">{score.toFixed(1)}%</p><div className="mt-4 h-2 overflow-hidden rounded-full bg-sky-100"><span className={`block h-full rounded-full ${color === 'blue' ? 'bg-brand-blue' : 'bg-brand-purple'}`} style={{ width: `${Math.min(Math.max(score, 0), 100)}%` }} /></div><p className="mt-2 text-[11px] font-medium text-navy-700/55">{detail}</p></div>; }
function Report({ report }: { report: MonthlyReportResponse }) { return <div className="mt-5 rounded-2xl bg-gradient-to-br from-sky-50/90 to-lavender-100/65 p-5"><div className="grid gap-3 sm:grid-cols-4"><Metric label="Income" value={formatINR(report.totalIncome)} /><Metric label="Expenses" value={formatINR(report.totalExpense)} /><Metric label="Savings" value={formatINR(report.savingsAmount)} /><Metric label="Health score" value={`${report.healthScore} · ${report.healthScoreLabel}`} /></div><div className="mt-5 border-t border-white/70 pt-4"><p className="flex items-center gap-2 text-xs font-extrabold text-brand-blue"><Sparkles className="h-4 w-4" /> Nova AI insight</p><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-navy-700">{report.aiInsight}</p></div></div>; }
function Metric({ label, value }: { label: string; value: string }) { return <div><p className="text-[10px] font-bold uppercase tracking-wide text-navy-700/45">{label}</p><p className="mt-1 text-sm font-extrabold text-navy-900">{value}</p></div>; }
function ChartEmpty({ text }: { text: string }) { return <p className="flex h-48 items-center justify-center text-center text-sm text-navy-700/55">{text}</p>; }
function AnalyticsSkeleton() { return <div className="space-y-5 animate-pulse"><div className="grid gap-4 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="glass-card h-56" />)}</div><div className="grid gap-4 xl:grid-cols-2"><div className="glass-card h-80" /><div className="glass-card h-80" /></div></div>; }
