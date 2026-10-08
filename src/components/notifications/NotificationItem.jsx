import { renderTypeIcon, formatRelativeTime } from './notificationUtils';

export default function NotificationItem({ notification: n, onClick, compact = true }) {
  const unread = !n.readAt;
  const count = n.metadata?.count;

  return (
    <button
      type="button"
      onClick={() => onClick?.(n)}
      className={`w-full text-left px-4 py-3 flex items-start gap-3 border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${unread ? 'bg-indigo-50/50 dark:bg-indigo-950/30' : ''}`}
    >
      <div className="w-8 h-8 bg-shnoor-indigo/10 rounded-full flex items-center justify-center flex-shrink-0">
        {renderTypeIcon(n.type, { size: 15, className: 'text-shnoor-indigo dark:text-indigo-300' })}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs text-slate-900 dark:text-white ${compact ? 'truncate' : ''} ${unread ? 'font-bold' : 'font-semibold'}`}>
          {n.title}
          {unread && count > 1 && (
            <span className="ml-1 text-[10px] font-bold text-rose-500">({count} new)</span>
          )}
        </p>
        {n.body && (
          <p className={`text-xs text-slate-600 dark:text-slate-300 mt-0.5 ${compact ? 'line-clamp-2' : ''}`}>
            {n.body}
          </p>
        )}
        <p className="text-[10px] text-slate-400 mt-1">{formatRelativeTime(n.updatedAt || n.createdAt)}</p>
      </div>
      {unread && <span className="w-2 h-2 mt-1.5 rounded-full bg-rose-500 flex-shrink-0" aria-label="Unread" />}
    </button>
  );
}
