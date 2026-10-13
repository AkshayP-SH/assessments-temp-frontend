import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCheck, RefreshCw } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import StudentHeader from '../components/StudentHeader';
import NotificationItem from '../components/notifications/NotificationItem';
import { getNotificationToken, notificationsApi } from '../hooks/useNotifications';
import { getNotificationSocket } from '../services/notificationSocket';

const PAGE_SIZE = 20;

function NotificationsList({ role }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const notificationToken = getNotificationToken(role);
  const [filter, setFilter] = useState('all');
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Keep the header bell in sync after actions taken on this page
  const syncBell = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['notifications', role] });
  }, [queryClient, role]);

  const load = useCallback(async (nextPage, replace) => {
    setLoading(true);
    setError(null);
    try {
      const unread = filter === 'unread' ? '&unread=true' : '';
      const data = await notificationsApi(role, `?page=${nextPage}&limit=${PAGE_SIZE}${unread}`);
      setItems((prev) => (replace ? data.items : [...prev, ...data.items]));
      setHasMore(data.hasMore);
      setUnreadCount(data.unreadCount);
      setPage(nextPage);
    } catch {
      setError('Could not load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filter, role]);

  useEffect(() => {
    load(1, true);
  }, [load]);

  useEffect(() => {
    const socket = getNotificationSocket(notificationToken);
    if (!socket) return undefined;

    const refresh = () => load(1, true);
    socket.on('notification:new', refresh);
    socket.on('notification:read', refresh);
    socket.on('connect', refresh);

    return () => {
      socket.off('notification:new', refresh);
      socket.off('notification:read', refresh);
      socket.off('connect', refresh);
    };
  }, [load, notificationToken]);

  const handleOpen = async (n) => {
    if (!n.readAt) {
      try {
        await notificationsApi(role, `/${n.id}/read`, { method: 'PATCH' });
      } catch {
        // navigation still makes sense even if marking read failed
      }
      syncBell();
    }
    if (n.link) navigate(n.link);
  };

  const handleMarkAll = async () => {
    try {
      await notificationsApi(role, '/read-all', { method: 'POST' });
      syncBell();
      load(1, true);
    } catch {
      setError('Could not mark notifications as read.');
    }
  };

  return (
    <div className="max-w-3xl w-full mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Notifications</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread` : 'You’re all caught up'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 dark:bg-[#1E1E38] p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            {['all', 'unread'].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md capitalize transition-all ${filter === f
                  ? 'bg-white dark:bg-[#2A2A4E] text-[#403f75] dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'}`}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => load(1, true)}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            title="Refresh"
          >
            <RefreshCw size={15} />
          </button>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAll}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg text-white bg-[#403f75] hover:bg-[#33325e]"
            >
              <CheckCheck size={14} />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="mb-3 px-4 py-3 text-sm rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{error}</p>
      )}

      <div className="bg-white dark:bg-[#1E1E38] border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        {items.length === 0 && !loading ? (
          <p className="px-4 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </p>
        ) : (
          items.map((n) => (
            <NotificationItem key={n.id} notification={n} onClick={handleOpen} compact={false} />
          ))
        )}
        {loading && (
          <p className="px-4 py-4 text-center text-xs text-slate-500 dark:text-slate-400">Loading…</p>
        )}
      </div>

      {hasMore && !loading && (
        <button
          type="button"
          onClick={() => load(page + 1, false)}
          className="mt-4 w-full py-2.5 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-[#403f75] dark:text-indigo-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
        >
          Load more
        </button>
      )}
    </div>
  );
}

export default function Notifications({ role = 'student' }) {
  if (role === 'admin') {
    return (
      <AdminLayout title="Notifications">
        <NotificationsList role="admin" />
      </AdminLayout>
    );
  }

  return (
    <div className="min-h-screen bg-theme-page font-sans text-theme-text transition-colors">
      <StudentHeader
        studentName={localStorage.getItem('studentName') || ''}
        studentId={localStorage.getItem('rollNumber') || ''}
        institute={localStorage.getItem('institute') || ''}
        subtitle="Notifications"
        showBackButton
      />
      <main className="w-full px-4 sm:px-6 py-6 sm:py-8">
        <NotificationsList role="student" />
      </main>
    </div>
  );
}
