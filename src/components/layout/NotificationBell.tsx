import { useCallback, useEffect, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { Link } from 'react-router';
import { notificationService } from '@/api/notificationService';
import { getCurrentUserId } from '@/api/axiosClient';
import type { NotificationResponse } from '@/types/notification';

/**
 * Module 15 — the header's unread badge and quick-look panel.
 *
 * ⚠️ THE BADGE COUNT AND THE PANEL LIST COME FROM TWO DIFFERENT ROUTES, ON
 * PURPOSE. The badge has to be correct before anything is clicked, so it reads
 * GET /notifications/user/{id}/unread-count once on mount — one small request per
 * page load. The list itself only loads when the panel opens, because fetching
 * every unread row on every page load to render a number would be wasteful.
 * Previously `items` was the only state, so the badge stayed invisible until you
 * clicked the bell — which is exactly backwards for a badge.
 *
 * Both numbers describe the same set, so opening the panel resyncs `count` to
 * `items.length` rather than trusting the older value.
 */
export function NotificationBell() {
  const userId = getCurrentUserId();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationResponse[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadCount = useCallback(async () => {
    if (!userId) return;
    try {
      setCount(await notificationService.getUnreadCount(userId));
    } catch {
      // A failed count must never break the header — leave the badge hidden.
    }
  }, [userId]);

  useEffect(() => {
    (async () => {
      await loadCount();
    })();
  }, [loadCount]);

  async function load() {
    if (!userId) return;
    setLoading(true);
    try {
      const unread = await notificationService.getUnread(userId);
      setItems(unread);
      setCount(unread.length);
    } finally {
      setLoading(false);
    }
  }

  async function togglePanel() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    await load();
  }

  async function markRead(item: NotificationResponse) {
    try {
      await notificationService.markRead(item.id);
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      setCount((current) => Math.max(0, current - 1));
    } catch {
      // Transient; the full Notifications page remains available.
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={count ? `Notifications, ${count} unread` : 'Notifications'}
        onClick={() => {
          void togglePanel();
        }}
        className="glass-card relative flex h-10 w-10 items-center justify-center text-navy-700/70 transition-colors hover:text-brand-blue"
      >
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-purple text-[9px] font-bold text-white shadow-glow">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="glass-card absolute right-0 z-40 mt-2 w-[320px] overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-sky-100 px-4 py-3">
            <p className="text-sm font-extrabold text-navy-900">Notifications</p>
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="text-[11px] font-bold text-brand-blue"
            >
              Manage
            </Link>
          </div>

          {loading ? (
            <div className="h-24 animate-pulse bg-sky-50/60" />
          ) : items.length ? (
            <div className="max-h-80 overflow-y-auto">
              {items.slice(0, 5).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => markRead(item)}
                  className="block w-full border-b border-sky-100 px-4 py-3 text-left hover:bg-sky-50"
                >
                  <p className="text-xs font-extrabold text-navy-800">{item.title}</p>
                  <p className="mt-1 line-clamp-2 text-[11px] text-navy-700/60">
                    {item.message}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center">
              <CheckCheck className="mx-auto h-5 w-5 text-brand-green" />
              <p className="mt-2 text-xs font-semibold text-navy-700">
                You&apos;re all caught up
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
