import { useCallback, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { adminService } from '@/api/adminService';
import { extractErrorMessage } from '@/api/axiosClient';
import { formatDate, formatINR } from '@/utils/format';
import type { UserDetailResponse } from '@/types/admin';

/**
 * GET /admin/users/{userId} — the full footprint of one account.
 *
 * ⚠️ A 404 HERE IS A REAL, EXPECTED OUTCOME, NOT A BUG. The controller returns
 * 404 when that userId has no profile row. Reaching this dialog from the user
 * list makes that unlikely, but the profile could have been deleted between the
 * list load and the click, so the message says what it means.
 */
export function UserDetailModal({
  userId,
  onClose,
}: {
  userId: number;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<UserDetailResponse | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setDetail(await adminService.getUserDetail(userId));
      setError(null);
      setStatus('success');
    } catch (err) {
      setError(
        extractErrorMessage(err, 'This account no longer has a profile.')
      );
      setStatus('error');
    }
  }, [userId]);

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="fixed inset-0 bg-navy-900/30 backdrop-blur-sm"
      />

      <div className="glass-card relative z-10 my-auto w-full max-w-lg p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-navy-900">
              {detail?.fullName ?? `User #${userId}`}
            </h2>
            <p className="mt-0.5 text-xs text-navy-700/55">
              Account #{userId}
              {detail?.preferredCurrency
                ? ` · ${detail.preferredCurrency}`
                : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-navy-700/50 hover:bg-sky-100 hover:text-navy-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {status === 'loading' && (
          <div className="mt-5 h-48 animate-pulse rounded-xl bg-sky-100/60" />
        )}

        {status === 'error' && (
          <p className="mt-5 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">
            {error}
          </p>
        )}

        {status === 'success' && detail && (
          <div className="mt-5 space-y-4">
            <Section title="Profile">
              <Row label="Phone" value={detail.phoneNumber ?? '—'} />
              <Row
                label="Monthly salary"
                value={
                  detail.monthlySalary !== null
                    ? formatINR(detail.monthlySalary)
                    : '—'
                }
              />
              <Row label="Primary goal" value={detail.primaryFinancialGoal ?? '—'} />
              <Row label="Joined" value={formatDate(detail.joinedAt.slice(0, 10))} />
              <Row
                label="Last updated"
                value={formatDate(detail.lastUpdatedAt.slice(0, 10))}
              />
            </Section>

            <Section title="Money">
              <Row
                label="Expenses"
                value={`${detail.expenseCount} · ${formatINR(detail.totalSpent)}`}
              />
              <Row
                label="Income"
                value={`${detail.incomeCount} · ${formatINR(detail.totalEarned)}`}
              />
              <Row
                label="Net savings"
                value={formatINR(detail.netSavings)}
                tone={detail.netSavings >= 0 ? 'green' : 'red'}
              />
              <Row
                label="Health score"
                value={`${detail.healthScore} / 100 · ${detail.healthScoreLabel}`}
              />
            </Section>

            <Section title="AI Usage">
              <Row label="Chat messages" value={String(detail.aiChatMessageCount)} />
              <Row
                label="Learned merchants"
                value={String(detail.learnedMerchantCount)}
              />
              <Row
                label="Monthly reports"
                value={String(detail.monthlyReportCount)}
              />
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-navy-700/70">{title}</p>
      <div className="space-y-1.5 rounded-xl bg-sky-50/70 px-4 py-3 text-xs">
        {children}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'green' | 'red';
}) {
  return (
    <p className="flex items-baseline justify-between gap-3">
      <span className="text-navy-700/55">{label}</span>
      <span
        className={`font-semibold ${
          tone === 'green'
            ? 'text-brand-green'
            : tone === 'red'
              ? 'text-red-500'
              : 'text-navy-900'
        }`}
      >
        {value}
      </span>
    </p>
  );
}
