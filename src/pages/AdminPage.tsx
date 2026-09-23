import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, ShieldAlert } from 'lucide-react';
import { adminService } from '@/api/adminService';
import { extractErrorMessage } from '@/api/axiosClient';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { AdminOverview } from '@/components/admin/AdminOverview';
import { AdminUsers } from '@/components/admin/AdminUsers';
import { AdminAiUsage } from '@/components/admin/AdminAiUsage';
import { AdminCategories } from '@/components/admin/AdminCategories';
import type { PlatformAnalyticsResponse } from '@/types/admin';

/**
 * Module 16 — Admin Panel. Every route behind /api/v1/admin/**.
 */

type Tab = 'OVERVIEW' | 'USERS' | 'AI' | 'CATEGORIES';

const TABS: { value: Tab; label: string }[] = [
  { value: 'OVERVIEW', label: 'Overview' },
  { value: 'USERS', label: 'Users' },
  { value: 'AI', label: 'AI Usage' },
  { value: 'CATEGORIES', label: 'Categories' },
];

export default function AdminPage() {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState<Tab>('OVERVIEW');
  const [analytics, setAnalytics] = useState<PlatformAnalyticsResponse | null>(
    null
  );
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    // Nothing to fetch for a non-admin — every route would answer 403.
    if (!isAdmin) {
      setStatus('success');
      return;
    }
    try {
      setAnalytics(await adminService.getAnalytics());
      setError(null);
      setStatus('success');
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not load platform analytics.'));
      setStatus('error');
    }
  }, [isAdmin]);

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <Header
          title="Admin Panel"
          subtitle="Platform-wide administration"
        />
        <EmptyState
          icon={<ShieldAlert className="h-7 w-7 text-brand-purple" />}
          title="This account is not an administrator"
          description="Admin access is granted by e-mail address on the server, so there is nothing to unlock here. Note that the role is assigned when an account is created: adding an address to the ADMIN_EMAILS setting does not promote an account that already exists — that address has to register fresh."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header
        title="Admin Panel"
        subtitle="Platform health, accounts and AI activity"
        action={
          <Button
            variant="secondary"
            icon={<RefreshCw className="h-4 w-4" />}
            onClick={load}
          >
            Refresh
          </Button>
        }
      />

      <div className="glass-card flex flex-wrap gap-2 p-2">
        {TABS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setTab(item.value)}
            className={`rounded-pill px-4 py-2 text-xs font-semibold transition-colors ${
              tab === item.value
                ? 'bg-gradient-to-r from-brand-blue to-brand-purple text-white shadow-soft'
                : 'text-navy-700/70 hover:bg-sky-100'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'OVERVIEW' && (
        <>
          {status === 'loading' && <div className="glass-card h-64 animate-pulse" />}
          {status === 'error' && (
            <EmptyState
              variant="error"
              title="Could not load analytics"
              description={error ?? 'Please try again in a moment.'}
              actionLabel="Retry"
              onAction={load}
            />
          )}
          {status === 'success' && analytics && (
            <AdminOverview analytics={analytics} />
          )}
        </>
      )}

      {/* Each tab loads its own data, so switching away never refetches this one. */}
      {tab === 'USERS' && <AdminUsers />}
      {tab === 'AI' && <AdminAiUsage />}
      {tab === 'CATEGORIES' && <AdminCategories />}
    </div>
  );
}
