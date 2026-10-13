import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Video, LogOut, Settings, MessageSquare, X, Menu, Building2, Bell, Briefcase } from 'lucide-react';
import Button from './Button';
import { useSupportSocket } from '../hooks/useSupportSocket';
import { API_URL } from '../config/api';
import shnoorLogo from '../assets/shnoor-logo.png';
import ThemeSelector from './ThemeSelector';

const AdminHeader = ({ viewAsControl, title }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('adminUser') || '{}');
    } catch {
      return {};
    }
  })();
  const isClientPortal = location.pathname.startsWith('/client');
  const isClientAdmin = currentUser?.role === 'client_admin' || !!localStorage.getItem('clientToken');
  const basePath = isClientPortal ? '/client' : '/admin';

  const [toastNotification, setToastNotification] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [unreadThreads, setUnreadThreads] = useState([]);
  const bellRef = useRef(null);
  const shownNotificationsRef = useRef(new Set());
  const socketCountReceivedRef = useRef(false);

  // Use support socket for real-time notifications with browser notifications enabled
  const {
    notifications,
    unreadCount: socketUnreadCount,
    markAllRead,
    removeNotification,
    notificationPermission,
    requestPermission
  } = useSupportSocket({ isAdmin: true, enabled: true, enableBrowserNotifications: true });
  const notificationsRef = useRef(notifications);
  notificationsRef.current = notifications;

  // Load unread conversations so the bell dropdown can list them after a page refresh
  const fetchUnreadThreads = useCallback(async (count) => {
    if (count <= 0) {
      setUnreadThreads([]);
      return;
    }
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;
      const response = await fetch(`${API_URL}/api/student-messages?status=unread&page=1&limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) return;
      const data = await response.json();
      if (!data.success) return;
      setUnreadThreads((data.messages || []).map(m => ({
        type: 'student-message',
        id: m.id,
        studentName: m.name,
        studentId: m.student_id,
        topic: m.topic,
        messagePreview: m.message,
        hasImage: !!m.image_path,
        timestamp: m.created_at,
        unread: parseInt(m.unread_count) || 0,
        read: false
      })));
    } catch (err) {
      console.error('Error fetching unread messages:', err);
    }
  }, []);

  // Fetch unread message count from DB (source of truth for the bell badge)
  const fetchUnreadCount = useCallback(async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const response = await fetch(`${API_URL}/api/student-messages/unread-count`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) return;

      const data = await response.json();
      if (data.success) {
        setUnreadCount(data.count);
        fetchUnreadThreads(data.count);
      }
    } catch (err) {
      if (!err.message?.includes('401')) {
        console.error('Error fetching unread count:', err);
      }
    }
  }, [fetchUnreadThreads]);

  // Live socket notifications first, then unread conversations from the DB (one entry per student)
  const bellNotifications = useMemo(() => {
    const liveStudents = new Set(notifications.map(n => n.studentId).filter(Boolean));
    return [...notifications, ...unreadThreads.filter(t => !t.studentId || !liveStudents.has(t.studentId))];
  }, [notifications, unreadThreads]);

  // Request notification permission on first interaction if not granted
  useEffect(() => {
    if (notificationPermission === 'default') {
      const handleClick = () => {
        requestPermission();
        document.removeEventListener('click', handleClick);
      };
      document.addEventListener('click', handleClick, { once: true });
    }
  }, [notificationPermission, requestPermission]);

  // Show toast only for new, unprocessed notifications and refresh badge from DB
  useEffect(() => {
    if (notifications.length === 0) return;
    const latest = notifications[0];
    if (!latest.read && !shownNotificationsRef.current.has(latest.id)) {
      shownNotificationsRef.current.add(latest.id);
      fetchUnreadCount();
      setToastNotification(latest);
      const timer = setTimeout(() => setToastNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notifications, fetchUnreadCount]);

  // Close the bell dropdown on outside click
  useEffect(() => {
    if (!bellOpen) return;
    const handleOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [bellOpen]);

  // Listen for admin reading all messages (dispatched by StudentMessages page)
  useEffect(() => {
    const handleAllRead = () => {
      setUnreadCount(0);
      setUnreadThreads([]);
    };
    window.addEventListener('admin-messages-all-read', handleAllRead);
    return () => window.removeEventListener('admin-messages-all-read', handleAllRead);
  }, []);

  // A single conversation was read (StudentMessages page): drop that student's items and resync from DB
  useEffect(() => {
    const handleConversationRead = (e) => {
      const { studentId, count } = e.detail || {};
      notificationsRef.current
        .filter(n => n.studentId === studentId)
        .forEach(n => removeNotification(n.id));
      setUnreadThreads(prev => prev.filter(t => t.studentId !== studentId));
      if (typeof count === 'number') setUnreadCount(count);
      fetchUnreadCount();
    };
    window.addEventListener('admin-conversation-read', handleConversationRead);
    return () => window.removeEventListener('admin-conversation-read', handleConversationRead);
  }, [removeNotification, fetchUnreadCount]);

  // Sync when socket reports unread count dropped to 0 (e.g. read from another tab)
  useEffect(() => {
    // Only sync after the socket has actually sent a count update (not the initial 0)
    if (socketCountReceivedRef.current && socketUnreadCount === 0) {
      setUnreadCount(0);
      setUnreadThreads([]);
    }
    if (socketUnreadCount > 0) {
      socketCountReceivedRef.current = true;
    }
  }, [socketUnreadCount]);

  // Poll unread count (on load and every 30s)
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/student-messages/mark-all-read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        markAllRead();
        setUnreadCount(0);
        setUnreadThreads([]);
        window.dispatchEvent(new Event('admin-messages-all-read'));
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const openMessages = () => {
    setBellOpen(false);
    setMobileMenuOpen(false);
    navigate(`${basePath}/student-messages`);
  };

  const formatTime = (iso) => {
    const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`;
    return new Date(iso).toLocaleDateString();
  };

  const badgeLabel = unreadCount > 99 ? '99+' : unreadCount;

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('clientToken');
    localStorage.removeItem('clientUser');
    sessionStorage.removeItem('superAdminSelectedClientId');
    // Always go to unified login; org tab pre-selected for client admins
    if (isClientPortal || isClientAdmin) {
      navigate('/login?portal=org');
      return;
    }
    navigate('/login');
  };

  return (
    <>
      <div className="w-full sticky top-0 z-50">
        <header className="admin-header w-full h-[60px] sm:h-[68px] shadow-sm sticky top-0 z-50 rounded-none border-b border-gray-200 bg-white/95 dark:bg-[#1A1A32]/95 backdrop-blur-md">
          <div className="w-full px-4 sm:px-6 lg:px-6 h-full flex items-center justify-between gap-4">
            {/* Left: Brand Logo & Title + Tenant Scope Switcher */}
            <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
              <div className="site-header-logo w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 bg-white border border-[#D1D1E6] dark:border-transparent shadow-2xs">
                <img
                  src={shnoorLogo}
                  alt="Shnoor Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-shrink-0">
                <h1 className="admin-header-title font-extrabold text-base sm:text-lg lg:text-xl leading-tight whitespace-nowrap text-slate-900 dark:text-white tracking-tight">
                  {title || 'SHNOOR Assessments'}
                </h1>
                <p className="admin-header-subtitle text-xs font-semibold text-[#403f75] dark:text-indigo-400 whitespace-nowrap leading-tight mt-0.5">
                  {isClientPortal ? 'Client Portal' : 'Admin Dashboard'}
                </p>
              </div>

              {viewAsControl && (
                <>
                  <div className="hidden md:block h-7 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1" />
                  <div className="hidden md:flex items-center">
                    {viewAsControl}
                  </div>
                </>
              )}
            </div>

            {/* Right Side: Desktop Navigation */}
            <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center bg-slate-100/90 dark:bg-[#1E1E38] p-1 rounded-xl border border-slate-200/90 dark:border-slate-700/80 shadow-2xs gap-0.5">
                <ThemeSelector variant="light" className="!rounded-lg !w-9 !h-9 !p-0 !border-0 !shadow-none !bg-transparent hover:bg-white/80 dark:hover:bg-slate-750 transition-all text-slate-600 dark:text-slate-300" />

                <div className="h-5 w-[1px] bg-slate-300/80 dark:bg-slate-700 mx-1" />

                <button
                  className={`h-9 px-3.5 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center relative btn-action-gesture ${location.pathname.includes('live-proctoring')
                    ? 'bg-white dark:bg-[#2A2A4E] text-[#403f75] dark:text-indigo-300 shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-slate-700/60'
                    }`}
                  onClick={() => navigate(`${basePath}/live-proctoring`)}
                >
                  <span className="relative flex h-2 w-2 mr-2">
                    <span className="animate-ping-slow absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                  <Video size={15} className="mr-1.5 text-current icon-gesture" />
                  <span>Live Proctoring</span>
                </button>
              </div>

              {/* Notification Bell (standalone, same style as the student header) */}
              <div className="relative flex-shrink-0 ml-1" ref={bellRef}>
                <button
                  type="button"
                  className={`relative w-10 h-10 rounded-xl flex items-center justify-center border border-slate-200/90 dark:border-slate-700/80 shadow-2xs transition-all text-slate-600 dark:text-slate-300 ${bellOpen
                    ? 'bg-white dark:bg-[#2A2A4E]'
                    : 'bg-slate-100/90 dark:bg-[#1E1E38] hover:bg-white/80 dark:hover:bg-slate-700'
                    }`}
                  onClick={() => setBellOpen(open => !open)}
                  title="Notifications"
                  aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                >
                  <Bell size={17} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold leading-[18px] text-center">
                      {badgeLabel}
                    </span>
                  )}
                </button>

                {bellOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#1E1E38] border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        Notifications{unreadCount > 0 ? ` (${unreadCount})` : ''}
                      </p>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          className="text-xs font-semibold text-[#403f75] dark:text-indigo-300 hover:underline"
                          onClick={handleMarkAllRead}
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                      {bellNotifications.length === 0 ? (
                        <p className="px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                          {unreadCount > 0
                            ? `${unreadCount} unread student message${unreadCount === 1 ? '' : 's'}`
                            : 'No new notifications'}
                        </p>
                      ) : (
                        bellNotifications.map(n => (
                          <button
                            key={n.id}
                            type="button"
                            className={`w-full text-left px-4 py-3 flex items-start gap-3 border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 ${n.read ? '' : 'bg-indigo-50/50 dark:bg-indigo-950/30'}`}
                            onClick={openMessages}
                          >
                            <div className="w-8 h-8 bg-shnoor-indigo/10 rounded-full flex items-center justify-center flex-shrink-0">
                              <MessageSquare size={15} className="text-shnoor-indigo" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                {n.studentName || 'Student'}
                                {n.topic && <span className="font-normal text-slate-500 dark:text-slate-400"> · {n.topic}</span>}
                                {n.unread > 1 && <span className="ml-1 text-[10px] font-bold text-rose-500">({n.unread} new)</span>}
                              </p>
                              <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mt-0.5">
                                {n.messagePreview || (n.hasImage ? 'Sent an image' : '')}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-1">{formatTime(n.timestamp)}</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>

                    <button
                      type="button"
                      className="w-full px-4 py-2.5 text-xs font-semibold text-center text-[#403f75] dark:text-indigo-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      onClick={openMessages}
                    >
                      View all messages
                    </button>
                  </div>
                )}
              </div>

              <button
                className="h-10 px-4 text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 bg-rose-50/90 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200/80 dark:border-rose-800/60 rounded-xl transition-all flex items-center justify-center shadow-2xs cursor-pointer ml-2 flex-shrink-0 active:scale-98 whitespace-nowrap btn-action-gesture"
                onClick={handleLogout}
                title="Logout from admin"
              >
                <LogOut size={15} className="mr-1.5 text-rose-600 dark:text-rose-400 icon-gesture" />
                <span>Logout</span>
              </button>
            </div>

            {/* Mobile Menu Toggle Button */}
            <div className="sm:hidden flex items-center gap-2 flex-shrink-0">
              <div className="admin-header-mobile-toggle">
                <ThemeSelector variant="light" />
                <button
                  type="button"
                  onClick={openMessages}
                  className="admin-header-menu-btn relative"
                  aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold leading-[18px] text-center">
                      {badgeLabel}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="admin-header-menu-btn"
                >
                  {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
              </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {mobileMenuOpen && (
              <div className="admin-header-mobile-menu">
                {viewAsControl && (
                  <div className="p-3 mb-2 bg-[#F1F3FB] dark:bg-[#1E1E38] rounded-xl">
                    {viewAsControl}
                  </div>
                )}
                <button
                  type="button"
                  className="admin-header-mobile-btn"
                  onClick={() => {
                    navigate(`${basePath}/live-proctoring`);
                    setMobileMenuOpen(false);
                  }}
                >
                  <Video size={16} />
                  <span>Live Proctoring</span>
                </button>

                <button
                  type="button"
                  className="admin-header-logout w-full justify-center"
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </header>
      </div>

      {/* Toast Notification */}
      {toastNotification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div
            className="bg-white rounded-xl shadow-2xl border border-gray-100 p-4 max-w-sm cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => {
              setToastNotification(null);
              if (toastNotification.type === 'job-application') {
                navigate(`${basePath}/job-applicants`);
              } else {
                navigate(`${basePath}/student-messages`);
              }
            }}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-shnoor-indigo/10 rounded-full flex items-center justify-center flex-shrink-0">
                {toastNotification.type === 'job-application' ? (
                  <Briefcase size={18} className="text-shnoor-indigo" />
                ) : (
                  <MessageSquare size={18} className="text-shnoor-indigo" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-shnoor-navy">
                  {toastNotification.type === 'job-application'
                    ? `New Application from ${toastNotification.studentName || 'Student'}`
                    : `New Message from ${toastNotification.studentName || 'Student'}`
                  }
                </p>
                <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                  {toastNotification.messagePreview}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setToastNotification(null);
                }}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminHeader;
