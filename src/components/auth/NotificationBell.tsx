// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// In-app notification bell — shows unread count, dropdown with messages.
// Admins also see a pending add-member request badge.
'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  readAt: string | null;
  createdAt: string;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
}

interface Props {
  role?: string | null;
}

function resolveNotificationUrl(n: AppNotification, isAdmin: boolean): string | null {
  switch (n.type) {
    case 'user_add_request_submitted':
      return isAdmin ? '/admin/settings?tab=requests' : null;
    case 'user_add_request_accepted':
      return isAdmin ? '/admin/settings?tab=requests' : '/members';
    case 'user_add_request_rejected':
      return '/members';
    case 'user_created':
      return isAdmin ? '/admin/users' : null;
    default:
      return null;
  }
}

function notificationIcon(type: string): string {
  switch (type) {
    case 'user_add_request_submitted': return '📬';
    case 'user_add_request_accepted':  return '✅';
    case 'user_add_request_rejected':  return '❌';
    case 'user_created':               return '👤';
    default:                           return '🔔';
  }
}

export default function NotificationBell({ role: roleProp }: Props) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [open, setOpen]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [resolvedRole, setResolvedRole] = useState<string | null>(roleProp ?? null);
  const ref = useRef<HTMLDivElement>(null);

  const isAdmin = resolvedRole === 'admin';

  // Fetch role from session if not provided via prop.
  useEffect(() => {
    if (roleProp !== undefined) return;
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.role) setResolvedRole(data.role); })
      .catch(() => {});
  }, [roleProp]);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setNotifications(data.notifications ?? []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  const loadPendingCount = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await fetch('/api/admin/user-add-requests?status=pending');
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setPendingRequests((data.requests ?? []).length);
      }
    } catch { /* ignore */ }
  }, [isAdmin]);

  // Poll every 30s while mounted
  useEffect(() => {
    loadNotifications();
    loadPendingCount();
    const id = setInterval(() => {
      loadNotifications();
      loadPendingCount();
    }, 30_000);
    return () => clearInterval(id);
  }, [loadNotifications, loadPendingCount]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [open]);

  async function markRead(id: string) {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, readAt: new Date().toISOString() } : n));
    } catch { /* ignore */ }
  }

  async function markAllRead() {
    const unread = notifications.filter(n => !n.readAt);
    await Promise.all(unread.map(n => fetch(`/api/notifications/${n.id}/read`, { method: 'PATCH' }).catch(() => {})));
    setNotifications(prev => prev.map(n => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
  }

  const unreadCount = notifications.filter(n => !n.readAt).length;
  const totalBadge  = unreadCount + (isAdmin ? pendingRequests : 0);

  function handleOpen() {
    setOpen(o => !o);
    if (!open) loadNotifications();
  }

  return (
    <>
      {/* Persistent amber strip below the header — shown outside dropdown, always visible */}
      {isAdmin && pendingRequests > 0 && (
        <div className="fixed left-0 right-0 z-30" style={{ top: 56 }}>
          <a
            href="/admin/settings?tab=requests"
            className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-1.5 text-xs font-black text-white shadow-md hover:bg-amber-600 transition-colors"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
            </span>
            {pendingRequests} pending member request{pendingRequests !== 1 ? 's' : ''} — click to review
            <span className="ml-1 opacity-70">→</span>
          </a>
        </div>
      )}

    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className="relative flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 transition-colors"
        aria-label="Notifications"
      >
        <span className={`text-lg ${totalBadge > 0 ? 'animate-wiggle' : ''}`}>🔔</span>
        {totalBadge > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center leading-none">
            {totalBadge > 99 ? '99+' : totalBadge}
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75 -z-10" />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 w-80 max-h-[480px] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
            <span className="text-sm font-black text-slate-900">
              Notifications
              {totalBadge > 0 && (
                <span className="ml-2 inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-red-500 text-white text-[10px] font-black">
                  {totalBadge}
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-[11px] font-bold text-blue-600 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Admin pending requests banner */}
          {isAdmin && pendingRequests > 0 && (
            <Link
              href="/admin/settings?tab=requests"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 bg-amber-50 border-b border-amber-100 hover:bg-amber-100 transition-colors"
            >
              <span className="text-lg shrink-0">📬</span>
              <div className="min-w-0">
                <p className="text-xs font-black text-amber-800">
                  {pendingRequests} pending member request{pendingRequests !== 1 ? 's' : ''}
                </p>
                <p className="text-[11px] text-amber-600">Tap to review in Admin Settings → Member Requests</p>
              </div>
            </Link>
          )}

          {/* Notification list */}
          <div className="overflow-y-auto flex-1">
            {loading && notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-slate-400">Loading…</div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-2xl mb-1">🔕</p>
                <p className="text-xs text-slate-400 font-semibold">No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => {
                const dest = resolveNotificationUrl(n, isAdmin);
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => {
                      if (!n.readAt) markRead(n.id);
                      setOpen(false);
                      if (dest) router.push(dest);
                    }}
                    className={`w-full text-left flex gap-3 px-4 py-3 border-b border-slate-50 last:border-0 transition-colors ${
                      dest ? 'hover:bg-blue-50 cursor-pointer' : 'hover:bg-slate-50'
                    } ${!n.readAt ? 'bg-blue-50/40' : ''}`}
                  >
                    <span className="text-base shrink-0 mt-0.5">{notificationIcon(n.type)}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-1">
                        <p className={`text-xs font-bold leading-snug ${!n.readAt ? 'text-blue-900' : 'text-slate-900'}`}>
                          {n.title}
                        </p>
                        <div className="flex items-center gap-1 shrink-0">
                          {!n.readAt && <span className="w-2 h-2 rounded-full bg-blue-500 mt-1" />}
                          {dest && <span className="text-[10px] text-blue-400 mt-0.5">→</span>}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-3 whitespace-pre-line">
                        {n.message}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
    </>
  );
}
