import { useCallback, useEffect, useState } from 'react';
import { Bell, CheckCheck, Clock3, FileText, Goal, PiggyBank, Trash2 } from 'lucide-react';
import { notificationService } from '@/api/notificationService';
import { extractErrorMessage, getCurrentUserId } from '@/api/axiosClient';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Toast, type ToastState } from '@/components/common/Toast';
import type { NotificationResponse, NotificationType } from '@/types/notification';

const meta: Record<NotificationType, { icon: typeof Bell; className: string }> = { BUDGET_ALERT: { icon: PiggyBank, className: 'bg-amber-100 text-amber-600' }, GOAL_DEADLINE: { icon: Goal, className: 'bg-lavender-100 text-brand-purple' }, DUE_REMINDER: { icon: Clock3, className: 'bg-sky-100 text-brand-blue' }, MONTHLY_SUMMARY: { icon: FileText, className: 'bg-emerald-100 text-brand-green' }, SYSTEM: { icon: Bell, className: 'bg-slate-100 text-slate-600' } };

export function NotificationSettingsPanel() {
  const userId = getCurrentUserId();
  const [items, setItems] = useState<NotificationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<'all' | 'unread'>('all');
  const [deleting, setDeleting] = useState<NotificationResponse | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const load = useCallback(async () => { if (!userId) return; setLoading(true); try { setItems(await notificationService.getAll(userId)); } catch (err) { setToast({ type: 'error', message: extractErrorMessage(err, 'Could not load notifications.') }); } finally { setLoading(false); } }, [userId]);
  useEffect(() => { (async () => { await load(); })(); }, [load]);
  const unread = items.filter((item) => !item.read).length;
  const visible = scope === 'all' ? items : items.filter((item) => !item.read);
  async function read(item: NotificationResponse) { if (item.read) return; try { await notificationService.markRead(item.id); setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, read: true } : entry)); } catch { setToast({ type: 'error', message: 'Could not update this notification.' }); } }
  async function readAll() { if (!userId) return; try { await notificationService.markAllRead(userId); setItems((current) => current.map((item) => ({ ...item, read: true }))); } catch { setToast({ type: 'error', message: 'Could not update notifications.' }); } }
  async function remove() { if (!deleting) return; try { await notificationService.remove(deleting.id); setItems((current) => current.filter((item) => item.id !== deleting.id)); setDeleting(null); setToast({ type: 'success', message: 'Notification deleted.' }); } catch { setToast({ type: 'error', message: 'Could not delete the notification.' }); } }
  return <><div className="glass-card overflow-hidden"><div className="flex flex-col gap-3 border-b border-sky-100 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-base font-extrabold text-navy-900">Notification inbox</h2><p className="mt-1 text-xs text-navy-700/55">Budget, goal, payment and report updates in one place.</p></div>{unread > 0 && <Button variant="secondary" icon={<CheckCheck className="h-4 w-4" />} onClick={readAll}>Mark all as read</Button>}</div><div className="flex gap-2 border-b border-sky-100 px-5 pt-3"><button onClick={() => setScope('all')} className={`border-b-2 px-3 pb-3 text-xs font-bold ${scope === 'all' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-navy-700/55'}`}>All ({items.length})</button><button onClick={() => setScope('unread')} className={`border-b-2 px-3 pb-3 text-xs font-bold ${scope === 'unread' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-navy-700/55'}`}>Unread ({unread})</button></div>{loading ? <div className="h-64 animate-pulse bg-sky-50/40" /> : visible.length ? <div className="divide-y divide-sky-100">{visible.map((item) => { const ItemIcon = meta[item.type]?.icon ?? Bell; return <div key={item.id} className={`flex gap-3 p-4 ${item.read ? '' : 'bg-sky-50/40'}`}><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta[item.type]?.className ?? meta.SYSTEM.className}`}><ItemIcon className="h-4 w-4" /></span><button onClick={() => read(item)} className="min-w-0 flex-1 text-left"><p className="text-sm font-extrabold text-navy-900">{item.title} {!item.read && <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-blue" />}</p><p className="mt-1 text-xs leading-relaxed text-navy-700/65">{item.message}</p></button><button onClick={() => setDeleting(item)} aria-label={`Delete ${item.title}`} className="rounded-lg p-2 text-navy-700/45 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-4 w-4" /></button></div>; })}</div> : <p className="py-14 text-center text-sm text-navy-700/55">{scope === 'unread' ? 'You are all caught up.' : 'No notifications yet.'}</p>}</div>{deleting && <ConfirmDialog title="Delete notification?" message="This notification will be permanently removed." onConfirm={remove} onCancel={() => setDeleting(null)} />}<Toast toast={toast} onDismiss={() => setToast(null)} /></>;
}
