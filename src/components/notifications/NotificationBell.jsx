import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationItem from './NotificationItem';
import { renderTypeIcon } from './notificationUtils';

// Shared across bell instances so one event never toasts twice in a tab
const toasted = new Set();

/**
 * Notification bell for every portal.
 *   role:         'admin' | 'student'
 *   viewAllPath:  route of the full notifications page
 *   showToasts:   only one mounted bell per page should toast
 *   buttonClassName / size: lets each header keep its own look
 */
export default function NotificationBell({
  role,
  viewAllPath,
  showToasts = true,
  buttonClassName = '',
  iconSize = 17,
  dropdownClassName = 'w-80',
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  // useNotifications needs handleNew, which needs markRead from useNotifications
  const markReadRef = useRef(null);

  const openNotification = useCallback((n) => {
    setOpen(false);
    if (n.id && !n.readAt) markReadRef.current?.(n.id);
    if (n.link) navigate(n.link);
  }, [navigate]);

  const handleNew = useCallback((n) => {
    if (!showToasts) return;
    const key = `${n.id || n.type}:${n.updatedAt || ''}`;
    if (toasted.has(key)) return;
    toasted.add(key);

    if (n.refresh) return; // bulk event: the badge updates, no per-item toast

    toast(
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-shnoor-indigo/10 rounded-full flex items-center justify-center flex-shrink-0">
          {renderTypeIcon(n.type, { size: 16, className: 'text-shnoor-indigo' })}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 line-clamp-1">{n.title}</p>
          {n.body && <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">{n.body}</p>}
        </div>
      </div>,
      { onClick: () => openNotification(n), autoClose: 5000, toastId: key }
    );

    // Desktop notification when the tab is in the background (permission is
    // requested by the existing support socket hook)
    if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const desktop = new Notification(n.title, { body: n.body || '', tag: String(n.id) });
        desktop.onclick = () => {
          window.focus();
          openNotification(n);
          desktop.close();
        };
      } catch {
        // some browsers only allow notifications from a service worker
      }
    }
  }, [showToasts, openNotification]);

  const { notifications, unreadCount, markRead, markAllRead, isLoading } = useNotifications({
    role,
    onNew: handleNew,
  });
  markReadRef.current = markRead;

  useEffect(() => {
    if (!open) return undefined;
    const handleOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const badgeLabel = unreadCount > 99 ? '99+' : unreadCount;

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        type="button"
        className={buttonClassName || `relative w-10 h-10 rounded-xl flex items-center justify-center border border-slate-200/90 dark:border-slate-700/80 shadow-2xs transition-all text-slate-600 dark:text-slate-300 ${open
          ? 'bg-white dark:bg-[#2A2A4E]'
          : 'bg-slate-100/90 dark:bg-[#1E1E38] hover:bg-white/80 dark:hover:bg-slate-700'
          }`}
        onClick={() => setOpen((v) => !v)}
        title="Notifications"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        aria-expanded={open}
      >
        <Bell size={iconSize} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold leading-[18px] text-center">
            {badgeLabel}
          </span>
        )}
      </button>

      {open && (
        <div className={`absolute right-0 mt-2 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-[#1E1E38] border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 ${dropdownClassName}`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              Notifications{unreadCount > 0 ? ` (${unreadCount})` : ''}
            </p>
            {unreadCount > 0 && (
              <button
                type="button"
                className="text-xs font-semibold text-[#403f75] dark:text-indigo-300 hover:underline"
                onClick={markAllRead}
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <p className="px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400">Loading…</p>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                You&apos;re all caught up
              </p>
            ) : (
              notifications.map((n) => (
                <NotificationItem key={n.id} notification={n} onClick={openNotification} />
              ))
            )}
          </div>

          {viewAllPath && (
            <button
              type="button"
              className="w-full px-4 py-2.5 text-xs font-semibold text-center text-[#403f75] dark:text-indigo-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
              onClick={() => {
                setOpen(false);
                navigate(viewAllPath);
              }}
            >
              View all notifications
            </button>
          )}
        </div>
      )}
    </div>
  );
}
