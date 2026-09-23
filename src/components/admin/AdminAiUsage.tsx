import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, Cpu } from 'lucide-react';
import { adminService } from '@/api/adminService';
import { extractErrorMessage } from '@/api/axiosClient';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDate } from '@/utils/format';
import {
  AI_MODULE_LABELS,
  type AdminPageResponse,
  type AiModule,
  type AiUsageLogResponse,
  type AiUsageSummaryResponse,
} from '@/types/admin';

const PAGE_SIZE = 20;

/**
 * GET /admin/ai-usage plus its drill-down at /logs.
 *
 * ⚠️ "CALLS" ARE PROVIDER ATTEMPTS, NOT USER REQUESTS. The DTO is explicit: one
 * request that fails over is two rows — a failed primary and a successful
 * fallback. So the headline number is labelled "provider calls", and the
 * fail-over count is shown next to it rather than folded into the failures.
 *
 * ⚠️ averageLatencyMs IS NULL UNTIL A CALL SUCCEEDS, and it averages successful
 * calls only. A null is rendered as "—", not as 0 ms.
 */
export function AdminAiUsage() {
  const [summary, setSummary] = useState<AiUsageSummaryResponse | null>(null);
  const [logs, setLogs] = useState<AdminPageResponse<AiUsageLogResponse> | null>(
    null
  );
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [usage, logPage] = await Promise.all([
        adminService.getAiUsage(),
        adminService.getAiUsageLogs(page, PAGE_SIZE),
      ]);
      setSummary(usage);
      setLogs(logPage);
      setError(null);
      setStatus('success');
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not load AI usage.'));
      setStatus('error');
    }
  }, [page]);

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  if (status === 'loading') {
    return <div className="glass-card h-64 animate-pulse" />;
  }

  if (status === 'error') {
    return (
      <EmptyState
        variant="error"
        title="Could not load AI usage"
        description={error ?? 'Please try again in a moment.'}
        actionLabel="Retry"
        onAction={load}
      />
    );
  }

  if (!summary) return null;

  const failureRate =
    summary.totalAiCalls > 0
      ? (summary.failedAiCalls / summary.totalAiCalls) * 100
      : 0;
  const moduleKeys = Object.keys(summary.callsByModule) as AiModule[];
  const maxModuleCalls = Math.max(1, ...moduleKeys.map((k) => summary.callsByModule[k]));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tile
          label="Provider Calls"
          value={summary.totalAiCalls.toLocaleString('en-IN')}
          note={`${summary.aiCallsLast7Days} in the last 7 days`}
          tint="from-brand-blue to-brand-purple"
        />
        <Tile
          label="Failures"
          value={summary.failedAiCalls.toLocaleString('en-IN')}
          note={`${failureRate.toFixed(1)}% of attempts`}
          tint={
            summary.failedAiCalls > 0
              ? 'from-red-400 to-red-500'
              : 'from-brand-green to-brand-cyan'
          }
        />
        <Tile
          label="Fell Over"
          value={summary.fallbackAiCalls.toLocaleString('en-IN')}
          note="served by the secondary provider"
          tint="from-amber-400 to-amber-500"
        />
        <Tile
          label="Avg Latency"
          value={
            summary.averageLatencyMs !== null
              ? `${Math.round(summary.averageLatencyMs)} ms`
              : '—'
          }
          note="successful calls only"
          tint="from-brand-cyan to-brand-blue"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="glass-card p-5 sm:p-6">
          <h2 className="text-sm font-bold text-navy-900">Calls by Module</h2>
          <div className="mt-4 space-y-3">
            {moduleKeys.map((key) => {
              const value = summary.callsByModule[key];
              return (
                <div key={key}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-xs font-semibold text-navy-800">
                      {AI_MODULE_LABELS[key] ?? key}
                    </span>
                    <span className="text-xs font-bold text-navy-900">
                      {value.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-pill bg-sky-100">
                    <span
                      className="block h-full rounded-pill bg-gradient-to-r from-brand-blue to-brand-cyan"
                      style={{ width: `${(value / maxModuleCalls) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 flex items-center justify-between gap-3 border-t border-sky-100 pt-3 text-xs">
            <span className="text-navy-700/55">Gemini / Ollama</span>
            <span className="font-bold text-navy-900">
              {summary.geminiCalls.toLocaleString('en-IN')} /{' '}
              {summary.ollamaCalls.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <div className="glass-card p-5 sm:p-6">
          <h2 className="text-sm font-bold text-navy-900">Feature Adoption</h2>
          <div className="mt-4 space-y-2 text-xs">
            <Line
              label="Chat messages"
              value={`${summary.totalChatMessages} (${summary.totalUserMessages} asked, ${summary.totalAiResponses} answered)`}
            />
            <Line
              label="Chatbot users"
              value={`${summary.distinctChatbotUsers} · ${summary.chatMessagesLast7Days} messages in 7 days`}
            />
            <Line
              label="Learned merchants"
              value={`${summary.totalLearnedMerchants} across ${summary.distinctCategorizationUsers} users`}
            />
            <Line label="Monthly reports" value={String(summary.totalMonthlyReports)} />
            <Line label="Distinct AI users" value={String(summary.distinctAiUsers)} />
          </div>
        </div>
      </div>

      <div className="glass-card p-2">
        <div className="flex items-center gap-2 px-3 py-3">
          <Cpu className="h-4 w-4 text-brand-blue" />
          <h2 className="text-sm font-bold text-navy-900">Provider Call Log</h2>
        </div>

        {!logs || logs.content.length === 0 ? (
          <p className="px-3 pb-4 text-xs text-navy-700/50">
            Nothing logged yet. Rows appear here as soon as an AI feature is used.
          </p>
        ) : (
          <>
            <div className="divide-y divide-sky-100">
              {logs.content.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-wrap items-center gap-3 px-3 py-2.5"
                >
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      log.success ? 'bg-brand-green' : 'bg-red-500'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-navy-900">
                      {AI_MODULE_LABELS[log.module] ?? log.module}
                      <span className="ml-2 font-normal text-navy-700/50">
                        {log.provider}
                      </span>
                    </p>
                    <p className="mt-0.5 text-[11px] text-navy-700/50">
                      {/* Null userId means a scheduler-driven call. */}
                      {log.userId !== null ? `User #${log.userId}` : 'Scheduled'} ·{' '}
                      {formatDate(log.createdAt.slice(0, 10))}
                      {log.latencyMs !== null ? ` · ${log.latencyMs} ms` : ''}
                    </p>
                  </div>
                  {log.usedFallback && (
                    <span className="shrink-0 rounded-pill bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                      Fallback
                    </span>
                  )}
                  {log.errorMessage && (
                    <span
                      title={log.errorMessage}
                      className="flex shrink-0 items-center gap-1 rounded-pill bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      Failed
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-sky-100 px-3 py-3">
              <p className="text-xs text-navy-700/55">
                {logs.totalElements.toLocaleString('en-IN')} attempts logged
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={logs.pageNumber === 0}
                  aria-label="Previous page"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 bg-white/70 text-navy-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-semibold text-navy-700">
                  {logs.pageNumber + 1} / {Math.max(1, logs.totalPages)}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={logs.last}
                  aria-label="Next page"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 bg-white/70 text-navy-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Tile({
  label,
  value,
  note,
  tint,
}: {
  label: string;
  value: string;
  note: string;
  tint: string;
}) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold text-navy-700/60">{label}</p>
        <div
          className={`h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br ${tint} shadow-soft`}
        />
      </div>
      <p className="mt-3 truncate text-2xl font-extrabold tracking-tight text-navy-900">
        {value}
      </p>
      <p className="mt-1 truncate text-xs text-navy-700/50">{note}</p>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <p className="flex items-baseline justify-between gap-3">
      <span className="text-navy-700/55">{label}</span>
      <span className="text-right font-semibold text-navy-900">{value}</span>
    </p>
  );
}
