import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { API_URL } from '../config/api';
import { getNotificationSocket } from '../services/notificationSocket';

const TOKEN_KEYS = { admin: 'adminToken', student: 'studentAuthToken' };

export const getNotificationToken = (role) => localStorage.getItem(TOKEN_KEYS[role]) || null;

// Raw fetch with the role's own token: the shared axios interceptor prefers
// adminToken, which is wrong when a student and an admin share one browser.
export async function notificationsApi(role, path, options = {}) {
  const token = getNotificationToken(role);
  if (!token) throw new Error('Not signed in');
  const res = await fetch(`${API_URL}/api/notifications${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...(options.headers || {}) },
  });
  if (!res.ok) throw new Error(`Notifications request failed (${res.status})`);
  return res.json();
}

const FEED_LIMIT = 15;

/**
 * Bell data for the current user.
 *   role: 'admin' (super admin + client admin) | 'student'
 *   onNew(notification): called for each real-time notification (toasts)
 *
 * The DB is the source of truth: the socket only patches the cached feed and
 * triggers refetches, and polling kicks in only while the socket is down.
 */
export function useNotifications({ role, enabled = true, onNew } = {}) {
  const queryClient = useQueryClient();
  const token = enabled ? getNotificationToken(role) : null;
  const queryKey = ['notifications', role, token ? token.slice(-16) : 'anon'];
  const [connected, setConnected] = useState(false);
  const onNewRef = useRef(onNew);
  onNewRef.current = onNew;

  const feed = useQuery({
    queryKey,
    queryFn: () => notificationsApi(role, `?limit=${FEED_LIMIT}`),
    enabled: !!token,
    staleTime: 30000,
    refetchOnWindowFocus: true,
    refetchInterval: connected ? false : 60000,
    retry: 1,
  });

  const keyRef = useRef(queryKey);
  keyRef.current = queryKey;

  const refetchFeed = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: keyRef.current });
  }, [queryClient]);

  useEffect(() => {
    if (!token) return undefined;
    const socket = getNotificationSocket(token);
    if (!socket) return undefined;

    const handleConnect = () => {
      setConnected(true);
      // Resync after (re)connect — events may have been missed while offline
      socket.emit('notifications:subscribe', () => refetchFeed());
    };
    const handleDisconnect = () => setConnected(false);

    const handleNew = (payload) => {
      if (!payload || payload.refresh || !payload.id) {
        refetchFeed();
        if (payload?.type) onNewRef.current?.(payload);
        return;
      }
      queryClient.setQueryData(keyRef.current, (old) => {
        if (!old) return old;
        const existing = old.items.find((n) => n.id === payload.id);
        const wasUnread = existing && !existing.readAt;
        return {
          ...old,
          items: [payload, ...old.items.filter((n) => n.id !== payload.id)].slice(0, FEED_LIMIT),
          unreadCount: old.unreadCount + (wasUnread ? 0 : 1),
        };
      });
      onNewRef.current?.(payload);
    };

    // Read in another tab / by another admin: refetch so the count stays exact
    const handleRead = () => refetchFeed();

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('notification:new', handleNew);
    socket.on('notification:read', handleRead);
    if (socket.connected) handleConnect();

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('notification:new', handleNew);
      socket.off('notification:read', handleRead);
    };
  }, [token, queryClient, refetchFeed]);

  const markRead = useCallback(async (id) => {
    queryClient.setQueryData(keyRef.current, (old) => {
      if (!old) return old;
      const target = old.items.find((n) => n.id === id);
      if (!target || target.readAt) return old;
      return {
        ...old,
        items: old.items.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
        unreadCount: Math.max(0, old.unreadCount - 1),
      };
    });
    try {
      await notificationsApi(role, `/${id}/read`, { method: 'PATCH' });
    } catch {
      refetchFeed();
    }
  }, [queryClient, role, refetchFeed]);

  const markAllRead = useCallback(async () => {
    queryClient.setQueryData(keyRef.current, (old) => (old ? {
      ...old,
      items: old.items.map((n) => (n.readAt ? n : { ...n, readAt: new Date().toISOString() })),
      unreadCount: 0,
    } : old));
    try {
      await notificationsApi(role, '/read-all', { method: 'POST' });
    } catch {
      refetchFeed();
    }
  }, [queryClient, role, refetchFeed]);

  return {
    notifications: feed.data?.items || [],
    unreadCount: feed.data?.unreadCount || 0,
    isLoading: feed.isLoading,
    isError: feed.isError,
    connected,
    markRead,
    markAllRead,
    refetch: refetchFeed,
  };
}
