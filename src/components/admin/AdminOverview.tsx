import {
  ArrowDownRight,
  ArrowUpRight,
  Layers,
  Receipt,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { formatINR } from '@/utils/format';
import type { PlatformAnalyticsResponse } from '@/types/admin';

/**
 * Platform totals from GET /admin/analytics.
 *
 * ⚠️ totalUsers COUNTS PROFILES, NOT ACCOUNTS. AdminServiceImpl builds the user
 * list from the profile table, and GET /admin/users/{userId} returns 404 for an
 * account with no profile — so someone who registered and never filled in a
 * profile is not in this number. The label says "with profiles" for that reason.
 */
export function AdminOverview({
  analytics,
}: {
  analytics: PlatformAnalyticsResponse;
}) {
  const { overview } = analytics;
  const netPositive = analytics.platformNetFlow >= 0;

  const tiles = [
    {
      label: 'Users',
      value: overview.totalUsers.toLocaleString('en-IN'),
      note: 'with profiles',
      icon: Users,
      tint: 'from-brand-blue to-brand-purple',
    },
    {
      label: 'Expenses Logged',
      value: overview.totalExpenses.toLocaleString('en-IN'),
      note: `${formatINR(analytics.platformTotalSpent)} total`,
      icon: Receipt,
      tint: 'from-brand-purple to-brand-sky',
    },
    {
      label: 'Incomes Logged',
      value: overview.totalIncomes.toLocaleString('en-IN'),
      note: `${formatINR(analytics.platformTotalEarned)} total`,
      icon: TrendingUp,
      tint: 'from-brand-green to-brand-cyan',
    },
    {
      label: 'Investments',
      value: overview.totalInvestments.toLocaleString('en-IN'),
      note: 'holdings tracked',
      icon: Wallet,
      tint: 'from-brand-cyan to-brand-blue',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="glass-card p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-semibold text-navy-700/60">
                {tile.label}
              </p>
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${tile.tint} text-white shadow-soft`}
              >
                <tile.icon className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 truncate text-2xl font-extrabold tracking-tight text-navy-900">
              {tile.value}
            </p>
            <p className="mt-1 truncate text-xs text-navy-700/50">{tile.note}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="glass-card p-5 sm:p-6">
          <h2 className="text-sm font-bold text-navy-900">Money Across the Platform</h2>
          <div className="mt-4 space-y-3">
            <Row
              label="Total earned"
              value={formatINR(analytics.platformTotalEarned)}
              tone="green"
            />
            <Row
              label="Total spent"
              value={formatINR(analytics.platformTotalSpent)}
              tone="red"
            />
            <div className="flex items-center justify-between gap-3 border-t border-sky-100 pt-3">
              <span className="text-xs font-semibold text-navy-700/70">
                Net flow
              </span>
              <span
                className={`flex items-center gap-1 text-sm font-extrabold ${
                  netPositive ? 'text-brand-green' : 'text-red-500'
                }`}
              >
                {netPositive ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                {formatINR(Math.abs(analytics.platformNetFlow))}
              </span>
            </div>
          </div>
        </div>

        <div className="glass-card p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-brand-blue" />
            <h2 className="text-sm font-bold text-navy-900">Categories</h2>
          </div>
          <div className="mt-4 space-y-3">
            <Row
              label="System defaults"
              value={overview.defaultCategories.toLocaleString('en-IN')}
            />
            <Row
              label="Created by users"
              value={overview.customCategories.toLocaleString('en-IN')}
            />
            <div className="flex items-center justify-between gap-3 border-t border-sky-100 pt-3">
              <span className="text-xs font-semibold text-navy-700/70">Total</span>
              <span className="text-sm font-extrabold text-navy-900">
                {overview.totalCategories.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
          {/* Defaults are seeded, so a fresh database still shows a number here. */}
          <p className="mt-4 text-xs text-navy-700/50">
            Defaults are visible to every account. Manage them on the Categories
            tab.
          </p>
        </div>
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
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-navy-700/55">{label}</span>
      <span
        className={`text-sm font-bold ${
          tone === 'green'
            ? 'text-brand-green'
            : tone === 'red'
              ? 'text-red-500'
              : 'text-navy-900'
        }`}
      >
        {value}
      </span>
    </div>
  );
}
