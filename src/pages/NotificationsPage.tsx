import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bell,
  CheckCheck,
  Clock3,
  FileText,
  Goal,
  Inbox,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import { notificationService } from '@/api/notificationService';
import { extractErrorMessage, getCurrentUserId } from '@/api/axiosClient';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { Toast, type ToastState } from '@/components/common/Toast';
import { formatDateTime, timeAgo } from '@/utils/format';
import type { NotificationResponse, NotificationType } from '@/types/notification';

/**
 * Module 15 — Notification Center.
 */
type Filter = 'all' | 'unread' | 'alerts' | 'reminders' | 'system';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'alerts', label: 'Alerts' },
  { value: 'reminders', label: 'Reminders' },
  { value: 'system', label: 'System' },
];

/**
 * All five NotificationType values, each with the tab it belongs to.
 * `tint` colours the card's icon square; `chip` colours the type label.
 */
const typeMeta: Record<
  NotificationType,
  { label: string; icon: typeof Bell; tint: string; chip: string; filter: Filter }
> = {
  BUDGET_ALERT: {
    label: 'Budget alert',
    icon: TriangleAlert,
    tint: 'bg-rose-100 text-rose-500',
    chip: 'bg-rose-50 text-rose-500',
    filter: 'alerts',
  },
  GOAL_DEADLINE: {
    label: 'Goal deadline',
    icon: Goal,
    tint: 'bg-orange-100 text-orange-500',
    chip: 'bg-orange-50 text-orange-500',
    filter: 'alerts',
  },
  DUE_REMINDER: {
    label: 'Due reminder',
    icon: Clock3,
    tint: 'bg-mint-100 text-brand-green',
    chip: 'bg-mint-50 text-brand-green',
    filter: 'reminders',
  },
  MONTHLY_SUMMARY: {
    label: 'Monthly summary',
    icon: FileText,
    tint: 'bg-sky-100 text-brand-blue',
    chip: 'bg-sky-50 text-brand-blue',
    filter: 'system',
  },
  SYSTEM: {
    label: 'System',
    icon: Bell,
    tint: 'bg-lavender-100 text-brand-purple',
    chip: 'bg-lavender-100 text-brand-purple',
    filter: 'system',
  },
};

/** An unrecognised type still has to land somewhere rather than vanish. */
function metaFor(type: NotificationType) {
  return typeMeta[type] ?? typeMeta.SYSTEM;
}

export default function NotificationsPage() {
  const userId = getCurrentUserId();
  const [items, setItems] = useState<NotificationResponse[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<NotificationResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setStatus('loading');
    try {
      setItems(await notificationService.getAll(userId));
      setError(null);
      setStatus('success');
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not load notifications.'));
      setStatus('error');
    }
  }, [userId]);

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  const counts = useMemo(
    () => ({
      all: items.length,
      unread: items.filter((item) => !item.read).length,
      alerts: items.filter((item) => metaFor(item.type).filter === 'alerts').length,
      reminders: items.filter((item) => metaFor(item.type).filter === 'reminders').length,
      system: items.filter((item) => metaFor(item.type).filter === 'system').length,
    }),
    [items]
  );

  const visible = useMemo(() => {
    if (filter === 'all') return items;
    if (filter === 'unread') return items.filter((item) => !item.read);
    return items.filter((item) => metaFor(item.type).filter === filter);
  }, [items, filter]);

  async function markRead(item: NotificationResponse) {
    if (item.read) return;
    try {
      await notificationService.markRead(item.id);
      setItems((current) =>
        current.map((entry) => (entry.id === item.id ? { ...entry, read: true } : entry))
      );
    } catch {
      setToast({ type: 'error', message: 'Could not mark this notification as read.' });
    }
  }

  async function markAll() {
    if (!userId) return;
    setBusy(true);
    try {
      await notificationService.markAllRead(userId);
      setItems((current) => current.map((item) => ({ ...item, read: true })));
      setToast({ type: 'success', message: 'All notifications marked as read.' });
    } catch {
      setToast({ type: 'error', message: 'Could not update notifications.' });
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!deleting) return;
    setBusy(true);
    try {
      await notificationService.remove(deleting.id);
      setItems((current) => current.filter((item) => item.id !== deleting.id));
      setDeleting(null);
      setToast({ type: 'success', message: 'Notification deleted.' });
    } catch {
      setToast({ type: 'error', message: 'Could not delete the notification.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="space-y-6">
        <Header
          title="Notifications"
          subtitle={
            counts.unread
              ? `${counts.unread} unread of ${counts.all} — budget alerts, goal deadlines and due reminders`
              : "You're all caught up on budgets, goals and due reminders"
          }
          action={
            counts.unread ? (
              <Button
                variant="secondary"
                icon={<CheckCheck className="h-4 w-4" />}
                loading={busy}
                onClick={markAll}
              >
                Mark all read
              </Button>
            ) : null
          }
        />

        {!userId && (
          <EmptyState
            variant="error"
            title="Not signed in"
            description="Sign in to view your finance notifications."
          />
        )}
        {userId && status === 'loading' && <Skeleton />}
        {userId && status === 'error' && (
          <EmptyState
            variant="error"
            title="Could not load notifications"
            description={error ?? 'Please try again.'}
            actionLabel="Retry"
            onAction={load}
          />
        )}

        {userId && status === 'success' && (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_310px]">
            <main className="min-w-0">
              <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
                {FILTERS.map(({ value, label }) => {
                  const selected = filter === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setFilter(value)}
                      className={`flex shrink-0 items-center gap-2 rounded-pill px-4 py-2.5 text-xs font-bold transition-all duration-200 ${
                        selected
                          ? 'bg-gradient-to-r from-brand-purple via-[#5b7ce8] to-brand-sky text-white shadow-glow'
                          : 'bg-white/60 text-navy-700/65 hover:bg-white hover:shadow-soft'
                      }`}
                    >
                      {label}
                      <span
                        className={`rounded-pill px-1.5 py-0.5 text-[10px] font-extrabold ${
                          selected ? 'bg-white/25 text-white' : 'bg-sky-100 text-brand-blue'
                        }`}
                      >
                        {counts[value]}
                      </span>
                    </button>
                  );
                })}
              </div>

              {visible.length ? (
                <div className="space-y-3">
                  {visible.map((item) => (
                    <NotificationCard
                      key={item.id}
                      item={item}
                      onRead={markRead}
                      onDelete={setDeleting}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Inbox className="h-7 w-7 text-brand-blue" />}
                  title={
                    filter === 'all' ? 'No notifications yet' : `Nothing under "${filter}"`
                  }
                  description={
                    filter === 'unread'
                      ? 'Every notification has been read.'
                      : 'New updates appear here as your budgets, goals and recurring payments change.'
                  }
                />
              )}
            </main>

            <aside className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <SummaryCard
                  icon={<Bell className="h-4 w-4" />}
                  value={counts.all}
                  label="Total"
                  tint="tint-blue"
                  chip="bg-sky-100 text-brand-blue"
                />
                <SummaryCard
                  icon={<Inbox className="h-4 w-4" />}
                  value={counts.unread}
                  label="Unread"
                  tint="tint-purple"
                  chip="bg-lavender-100 text-brand-purple"
                />
                <SummaryCard
                  icon={<TriangleAlert className="h-4 w-4" />}
                  value={counts.alerts}
                  label="Alerts"
                  tint="tint-cyan"
                  chip="bg-rose-100 text-rose-500"
                />
                <SummaryCard
                  icon={<Clock3 className="h-4 w-4" />}
                  value={counts.reminders}
                  label="Reminders"
                  tint="tint-mint"
                  chip="bg-mint-100 text-brand-green"
                />
              </div>

              {/*
                A legend rather than filler copy: these are the only five kinds the
                backend can produce, so listing them tells you exactly what this
                screen will ever show.
              */}
              <div className="glass-card p-5">
                <p className="text-sm font-extrabold text-navy-900">What lands here</p>
                <p className="mt-1.5 text-xs leading-relaxed text-navy-700/60">
                  Generated from your own budget, goal and recurring-payment activity —
                  nothing is promotional.
                </p>
                <ul className="mt-4 space-y-2.5">
                  {(Object.keys(typeMeta) as NotificationType[]).map((type) => {
                    const meta = typeMeta[type];
                    const Icon = meta.icon;
                    return (
                      <li key={type} className="flex items-center gap-2.5">
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${meta.tint}`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-[11px] font-bold text-navy-700/75">
                          {meta.label}
                        </span>
                        <span className="ml-auto text-[11px] font-extrabold text-navy-900">
                          {items.filter((item) => item.type === type).length}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </aside>
          </div>
        )}
      </div>

      {deleting && (
        <ConfirmDialog
          title="Delete notification?"
          message={`"${deleting.title}" will be permanently removed. This does not undo the budget or goal change that triggered it.`}
          loading={busy}
          onConfirm={remove}
          onCancel={() => setDeleting(null)}
        />
      )}
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </>
  );
}

/**
 * Displays one notification.
 * Unread notifications are clickable and mark themselves as read; read notifications
 * are not clickable because there is no action to perform.
 */
function NotificationCard({
  item,
  onRead,
  onDelete,
}: {
  item: NotificationResponse;
  onRead: (item: NotificationResponse) => void;
  onDelete: (item: NotificationResponse) => void;
}) {
  const meta = metaFor(item.type);
  const Icon = meta.icon;

  const body = (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-extrabold text-navy-900">{item.title}</h2>
        <span className={`rounded-pill px-2 py-0.5 text-[10px] font-bold ${meta.chip}`}>
          {meta.label}
        </span>
        {!item.read && (
          <span className="rounded-pill bg-brand-purple px-2 py-0.5 text-[10px] font-extrabold text-white">
            New
          </span>
        )}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-navy-700/70">{item.message}</p>
      <p className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-navy-700/45">
        {/* Relative for scanning, exact on hover. */}
        <span title={formatDateTime(item.createdAt)}>{timeAgo(item.createdAt)}</span>
        {!item.read && (
          <>
            <span aria-hidden="true">·</span>
            <span className="text-brand-blue">Click to mark as read</span>
          </>
        )}
      </p>
    </>
  );

  return (
    <article
      className={`glass-card relative flex gap-4 overflow-hidden p-5 transition-shadow duration-200 hover:shadow-lift ${
        item.read ? '' : 'tint-purple'
      }`}
    >
      {/* Accent bar: a far quicker unread cue than a small dot. */}
      {!item.read && (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-brand-purple to-brand-sky"
        />
      )}

      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${meta.tint}`}
      >
        <Icon className="h-5 w-5" />
      </span>

      {item.read ? (
        <div className="min-w-0 flex-1">{body}</div>
      ) : (
        <button type="button" onClick={() => onRead(item)} className="min-w-0 flex-1 text-left">
          {body}
        </button>
      )}

      <button
        type="button"
        aria-label={`Delete ${item.title}`}
        onClick={() => onDelete(item)}
        className="h-9 shrink-0 rounded-xl p-2 text-navy-700/35 transition-colors hover:bg-rose-50 hover:text-rose-500"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </article>
  );
}

function SummaryCard({
  icon,
  value,
  label,
  tint,
  chip,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  tint: string;
  chip: string;
}) {
  return (
    <div className={`glass-card ${tint} p-4`}>
      <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${chip}`}>
        {icon}
      </span>
      <p className="mt-3 text-xl font-extrabold leading-none text-navy-900">{value}</p>
      <p className="mt-1 text-[10px] font-bold text-navy-700/60">{label}</p>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="grid animate-pulse gap-5 xl:grid-cols-[minmax(0,1fr)_310px]">
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="glass-card h-32" />
        ))}
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="glass-card h-[104px]" />
          ))}
        </div>
        <div className="glass-card h-64" />
      </div>
    </div>
  );
}
