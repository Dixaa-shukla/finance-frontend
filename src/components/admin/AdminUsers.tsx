import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, Users } from 'lucide-react';
import { adminService } from '@/api/adminService';
import { extractErrorMessage } from '@/api/axiosClient';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDate } from '@/utils/format';
import { UserDetailModal } from '@/components/admin/UserDetailModal';
import type { AdminPageResponse, UserSummaryResponse } from '@/types/admin';

const PAGE_SIZE = 20;

/**
 * GET /admin/users — server-paginated, newest profile first.
 *
 * ⚠️ PAGINATION IS SERVER-SIDE AND THE SORT IS NOT NEGOTIABLE. The controller
 * hard-codes Sort.by(DESC, "createdAt") and clamps size to 100, so there is no
 * sort control here — offering one would imply something the route cannot do.
 *
 * profilePictureUrl is not rendered in THIS table. The app does use profile
 * photos (see ProfileImageUploader and the header avatar in UserMenu) — this is a
 * dense admin list where a column of avatars would cost a row of height per user
 * without helping an admin scan by email. UserDetailModal is the place for it.
 */
export function AdminUsers() {
  const [page, setPage] = useState(0);
  const [data, setData] = useState<AdminPageResponse<UserSummaryResponse> | null>(
    null
  );
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await adminService.getUsers(page, PAGE_SIZE));
      setError(null);
      setStatus('success');
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not load the user list.'));
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
        title="Could not load users"
        description={error ?? 'Please try again in a moment.'}
        actionLabel="Retry"
        onAction={load}
      />
    );
  }

  if (!data || data.content.length === 0) {
    return (
      <EmptyState
        icon={<Users className="h-7 w-7 text-brand-blue" />}
        title="No users with profiles yet"
        description="This list is built from the profile table, so an account that has not completed its profile does not appear here."
      />
    );
  }

  const from = data.pageNumber * data.pageSize + 1;
  const to = from + data.content.length - 1;

  return (
    <>
      <div className="glass-card p-2">
        <div className="divide-y divide-sky-100">
          {data.content.map((user) => (
            <div
              key={user.userId}
              className="flex flex-wrap items-center gap-3 px-3 py-3"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-xs font-extrabold text-brand-blue">
                #{user.userId}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-navy-900">
                  {user.fullName ?? `User ${user.userId}`}
                </p>
                <p className="mt-0.5 text-[11px] text-navy-700/50">
                  Joined {formatDate(user.joinedAt.slice(0, 10))}
                  {user.preferredCurrency
                    ? ` · ${user.preferredCurrency}`
                    : ''}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="rounded-pill bg-lavender-100 px-2.5 py-1 text-[11px] font-bold text-brand-purple">
                  {user.expenseCount} exp
                </span>
                <span className="rounded-pill bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-brand-green">
                  {user.incomeCount} inc
                </span>
                <button
                  type="button"
                  onClick={() => setSelected(user.userId)}
                  className="inline-flex items-center gap-1.5 rounded-pill border border-sky-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-navy-700 transition-colors hover:bg-white"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Details
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-sky-100 px-3 py-3">
          <p className="text-xs text-navy-700/55">
            Showing {from}–{to} of {data.totalElements}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={data.pageNumber === 0}
              aria-label="Previous page"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 bg-white/70 text-navy-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-semibold text-navy-700">
              {data.pageNumber + 1} / {Math.max(1, data.totalPages)}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={data.last}
              aria-label="Next page"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 bg-white/70 text-navy-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {selected !== null && (
        <UserDetailModal userId={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
