import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { API_URL } from '../config/api';
import { SOCKET_TRANSPORTS } from '../config/socket';

const SOCKET_URL = API_URL;

/**
 * Request browser notification permission
 */
const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

/**
 * Show a browser notification
 */
const showBrowserNotification = (title, body, options = {}) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return null;
  }

  try {
    const notification = new Notification(title, {
      body,
      icon: '/favicon.png',
      badge: '/favicon.png',
      tag: options.tag || 'support-message',
      requireInteraction: false,
      silent: false,
      ...options
    });

    notification.onclick = () => {
      window.focus();
      if (options.onClick) options.onClick();
      notification.close();
    };

    // Auto-close after 8 seconds
    setTimeout(() => notification.close(), 8000);

    return notification;
  } catch (error) {
    console.error('[BrowserNotification] Error:', error);
    return null;
  }
};

/**
 * Hook for managing support message socket connection and notifications
 * @param {Object} options - Configuration options
 * @param {boolean} options.isAdmin - Whether the user is an admin
 * @param {string} options.rollNumber - Student roll number (for student mode)
 * @param {string} options.studentName - Student name (for student mode)
 * @param {boolean} options.enabled - Whether to enable socket connection
 * @param {boolean} options.enableBrowserNotifications - Whether to show browser notifications
 * @returns {Object} Socket state and methods
 */
export const useSupportSocket = ({ 
  isAdmin = false, 
  rollNumber, 
  studentName, 
  enabled = true,
  enableBrowserNotifications = true 
} = {}) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationPermission, setNotificationPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'denied'
  );

  // Request notification permission on mount
  useEffect(() => {
    if (enableBrowserNotifications && enabled) {
      requestNotificationPermission().then(granted => {
        setNotificationPermission(granted ? 'granted' : 'denied');
      });
    }
  }, [enableBrowserNotifications, enabled]);

  // Add a notification
  const addNotification = useCallback((notification, showBrowserNotif = true) => {
    const newNotification = {
      ...notification,
      id: notification.id || Date.now(),
      timestamp: notification.createdAt || new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep last 50
    setUnreadCount(prev => prev + 1);

    // Show browser notification if enabled (show regardless of focus for immediate visibility)
    if (showBrowserNotif && enableBrowserNotifications) {
      if (notification.type === 'student-message') {
        showBrowserNotification(
          `New message from ${notification.studentName || 'Student'}`,
          notification.messagePreview || 'You have a new support message',
          { tag: `support-${notification.id}` }
        );
      } else if (notification.type === 'job-application') {
        showBrowserNotification(
          `New Application: ${notification.studentName || 'Student'}`,
          notification.messagePreview || 'A new job application was submitted',
          { tag: `job-${notification.id}` }
        );
      } else if (notification.type === 'admin-reply') {
        showBrowserNotification(
          'New reply from Support',
          notification.messagePreview || 'You have a new reply from admin',
          { tag: `support-${notification.id}` }
        );
      }
    }
  }, [enableBrowserNotifications]);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Mark notifications as read
  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  // Remove a notification
  const removeNotification = useCallback((notificationId) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        setUnreadCount(count => Math.max(0, count - 1));
      }
      return prev.filter(n => n.id !== notificationId);
    });
  }, []);

  // Initialize socket connection
  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Listen for admin messages all read event
    const handleAllRead = () => {
      clearNotifications();
    };
    
    window.addEventListener('admin-messages-all-read', handleAllRead);

    // Create socket connection with error handling
    let socket;
    let connectionAttempts = 0;
    const MAX_ATTEMPTS = 3;

    try {
      const adminToken = isAdmin ? localStorage.getItem('adminToken') : null;

      socket = io(SOCKET_URL, {
        transports: [...SOCKET_TRANSPORTS],
        reconnection: true,
        reconnectionAttempts: MAX_ATTEMPTS,
        reconnectionDelay: 2000,
        timeout: 10000,
        autoConnect: true,
        auth: adminToken ? { token: adminToken } : undefined,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        setIsConnected(true);
        connectionAttempts = 0; // Reset on successful connection

        // Join appropriate room based on user type
        if (isAdmin) {
          socket.emit('admin:join-support');
        } else if (rollNumber) {
          socket.emit('student:join-support', { rollNumber, studentName });
        }
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
      });

      socket.on('connect_error', (error) => {
        connectionAttempts++;
        console.warn(`[SupportSocket] Connection error (${connectionAttempts}/${MAX_ATTEMPTS}):`, error.message);
        setIsConnected(false);
        
        // Stop trying after max attempts
        if (connectionAttempts >= MAX_ATTEMPTS) {
          console.warn('[SupportSocket] Max connection attempts reached, stopping reconnection');
          socket.disconnect();
        }
      });

      socket.on('reconnect_failed', () => {
        console.warn('[SupportSocket] Reconnection failed after max attempts');
        setIsConnected(false);
      });
    } catch (error) {
      console.error('[SupportSocket] Failed to initialize socket:', error);
    }

    // Admin notifications - new student message
    if (isAdmin && socket) {
      socket.on('support:new-student-message', (data) => {
        addNotification({
          type: 'student-message',
          id: data.id,
          studentName: data.studentName,
          studentId: data.studentId,
          college: data.college,
          messagePreview: data.messagePreview,
          topic: data.topic,
          createdAt: data.createdAt,
          hasImage: data.hasImage
        }, true);
      });

      // Real-time unread count update (when messages are marked read)
      socket.on('support:unread-count-update', (data) => {
        setUnreadCount(data.count);
        if (data.count === 0) {
          clearNotifications();
        }
      });

      // New Job Application
      socket.on('job:applied', (data) => {
        addNotification({
          type: 'job-application',
          id: data.applicationId || Date.now(),
          studentName: data.studentName,
          studentId: data.studentId,
          jobRole: data.jobRole,
          companyName: data.companyName,
          messagePreview: `Applied for ${data.jobRole} at ${data.companyName}`,
          createdAt: data.createdAt || new Date().toISOString()
        }, true);
      });

    }

    // Student notifications - new admin reply
    if (!isAdmin && rollNumber) {
      socket.on('support:new-admin-reply', (data) => {
        addNotification({
          type: 'admin-reply',
          id: data.id,
          messagePreview: data.messagePreview,
          createdAt: data.createdAt,
          hasImage: data.hasImage
        }, true);
      });

    }

    // Cleanup on unmount
    return () => {
      window.removeEventListener('admin-messages-all-read', handleAllRead);
      if (socket) {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('connect_error');
        socket.off('reconnect_failed');
        socket.off('support:new-student-message');
        socket.off('support:unread-count-update');
        socket.off('support:new-admin-reply');
        socket.off('student:support-joined');
        socket.off('admin:support-joined');
        socket.disconnect();
      }
    };
  }, [enabled, isAdmin, rollNumber, studentName, addNotification, clearNotifications]);

  // Provide a getter function for the socket instead of directly returning ref.current
  const getSocket = useCallback(() => socketRef.current, []);

  // Method to request notification permission
  const requestPermission = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setNotificationPermission(granted ? 'granted' : 'denied');
    return granted;
  }, []);

  return {
    getSocket,
    isConnected,
    notifications,
    unreadCount,
    markAllRead,
    removeNotification,
    notificationPermission,
    requestPermission
  };
};

export default useSupportSocket;
