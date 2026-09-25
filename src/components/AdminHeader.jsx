import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Video, LogOut, Settings, MessageSquare, X, Menu, Building2 } from 'lucide-react';
import Button from './Button';
import { useSupportSocket } from '../hooks/useSupportSocket';
import { API_URL } from '../config/api';
import shnoorLogo from '../assets/shnoor-logo.png';
import ThemeSelector from './ThemeSelector';

const AdminHeader = () => {
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
  const shownNotificationsRef = useRef(new Set());
  const socketCountReceivedRef = useRef(false);

  // Use support socket for real-time notifications with browser notifications enabled
  const {
    notifications,
    unreadCount: socketUnreadCount,
    notificationPermission,
    requestPermission
  } = useSupportSocket({ isAdmin: true, enabled: true, enableBrowserNotifications: true });

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

  // Show toast only for new, unprocessed notifications and increment badge
  useEffect(() => {
    if (notifications.length === 0) return;
    const latest = notifications[0];
    if (!latest.read && !shownNotificationsRef.current.has(latest.id)) {
      shownNotificationsRef.current.add(latest.id);
      setUnreadCount(prev => prev + 1);
      setToastNotification(latest);
      const timer = setTimeout(() => setToastNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notifications]);

  // Listen for admin reading all messages (dispatched by StudentMessages page)
  useEffect(() => {
    const handleAllRead = () => setUnreadCount(0);
    window.addEventListener('admin-messages-all-read', handleAllRead);
    return () => window.removeEventListener('admin-messages-all-read', handleAllRead);
  }, []);

  // Sync when socket reports unread count dropped to 0 (e.g. read from another tab)
  useEffect(() => {
    // Only sync after the socket has actually sent a count update (not the initial 0)
    if (socketCountReceivedRef.current && socketUnreadCount === 0) {
      setUnreadCount(0);
    }
    if (socketUnreadCount > 0) {
      socketCountReceivedRef.current = true;
    }
  }, [socketUnreadCount]);

  // Fetch unread message count from DB (source of truth on load)
  useEffect(() => {
    const fetchUnreadCount = async () => {
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
        }
      } catch (err) {
        if (!err.message?.includes('401')) {
          console.error('Error fetching unread count:', err);
        }
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('clientToken');
    localStorage.removeItem('clientUser');
    // Always go to unified login; org tab pre-selected for client admins
    if (isClientPortal || isClientAdmin) {
      navigate('/login?portal=org');
      return;
    }
    navigate('/login');
  };

  return (
    <>
      <div className="w-full">
      <header className="w-full bg-white h-[60px] sm:h-[72px] shadow-sm relative z-50 rounded-none border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
            {/* Logo icon */}
            <div className="site-header-logo w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 bg-white border border-[#D1D1E6] dark:border-transparent">
              <img
                src={shnoorLogo}
                alt="Shnoor Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-[#403f75] dark:text-white font-bold text-base sm:text-lg leading-tight truncate">Shnoor Assessment</h1>
              <p className="text-[#403f75] dark:text-[#9A9AC9] text-[10px] sm:text-xs truncate">
                {isClientPortal ? 'Client Portal' : 'Admin Dashboard'}
              </p>
            </div>

          {/* Right Side: Desktop Navigation */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center justify-center">
              <ThemeSelector className="!bg-white !border !border-[#D1D1E6] !text-[#403f75] !rounded-xl hover:!bg-gray-50" />
            </div>
            <button
              className={`h-10 px-4 text-sm font-bold transition-all border border-[#D1D1E6] dark:border-[#383863] bg-white dark:bg-transparent text-[#403f75] dark:text-[#9A9AC9] rounded-xl flex items-center justify-center hover:bg-blue-50 dark:hover:bg-[#383863] dark:hover:text-white relative ${
                location.pathname.includes('student-messages') ? 'bg-blue-50 dark:bg-[#403f75] dark:text-white' : ''
              }`}
              onClick={() => navigate(`${basePath}/student-messages`)}
            >
              <MessageSquare size={16} className="mr-2" />
              <span>Messages</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            {!isClientAdmin && (
              <button
                className={`h-10 px-4 text-sm font-bold transition-all border border-[#D1D1E6] dark:border-[#383863] bg-white dark:bg-transparent text-[#403f75] dark:text-[#9A9AC9] rounded-xl flex items-center justify-center hover:bg-blue-50 dark:hover:bg-[#383863] dark:hover:text-white relative ${
                  location.pathname.includes('clients') ? 'bg-blue-50 dark:bg-[#403f75] dark:text-white' : ''
                }`}
                onClick={() => navigate('/admin/clients')}
              >
                <Building2 size={16} className="mr-2" />
                <span>Clients</span>
              </button>
            )}
            <button
              className={`h-10 px-4 text-sm font-bold transition-all border border-[#D1D1E6] dark:border-[#383863] bg-white dark:bg-transparent text-[#403f75] dark:text-[#9A9AC9] rounded-xl flex items-center justify-center hover:bg-blue-50 dark:hover:bg-[#383863] dark:hover:text-white relative ${
                location.pathname.includes('live-proctoring') ? 'bg-blue-50 dark:bg-[#403f75] dark:text-white' : ''
              }`}
              onClick={() => navigate(`${basePath}/live-proctoring`)}
            >
              <Video size={16} className="mr-2" />
              <span>Live Proctoring</span>
            </button>
            <button
              className={`h-10 px-4 text-sm font-bold transition-all border border-[#D1D1E6] dark:border-[#383863] bg-white dark:bg-transparent text-[#403f75] dark:text-[#9A9AC9] rounded-xl flex items-center justify-center hover:bg-blue-50 dark:hover:bg-[#383863] dark:hover:text-white relative ${
                location.pathname.includes('settings') ? 'bg-blue-50 dark:bg-[#403f75] dark:text-white' : ''
              }`}
              onClick={() => navigate(`${basePath}/settings`)}
            >
              <Settings size={16} className="mr-2" />
              <span>Settings</span>
            </button>
            <button
              className="h-10 px-6 text-sm font-bold transition-all border-0 relative rounded-xl flex items-center justify-center text-white bg-[#403f75] hover:bg-[#2d2d53] shadow-sm ml-2"
              onClick={handleLogout}
            >
              <LogOut size={16} className="mr-2" />
              <span>Logout</span>
            </button>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="sm:hidden flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center justify-center">
              <ThemeSelector className="!bg-[#9A9AC9] !border-none !text-shnoor-navyLight !rounded-lg hover:opacity-90" />
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-900 p-2 hover:bg-gray-100 rounded-lg transition-colors relative min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation flex-shrink-0"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              {!mobileMenuOpen && unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border border-white"></span>
              )}

              <button
                type="button"
                onClick={() => navigate(`${basePath}/live-proctoring`)}
                className="admin-header-btn"
              >
                <Video size={16} />
                <span>Live Proctoring</span>
              </button>

              <button
                type="button"
                onClick={() => navigate(`${basePath}/settings`)}
                className="admin-header-btn"
              >
                <Settings size={16} />
                <span>Settings</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="admin-header-logout"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>

            {/* Mobile Menu Toggle Button */}
            <div className="admin-header-mobile-toggle">
              <ThemeSelector variant="light" />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="admin-header-menu-btn"
              >
                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                {!mobileMenuOpen && unreadCount > 0 && (
                  <span className="admin-header-dot"></span>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="admin-header-mobile-menu">
              <button
                type="button"
                className="admin-header-mobile-btn"
                onClick={() => {
                  navigate(`${basePath}/student-messages`);
                  setMobileMenuOpen(false);
                }}
              >
                <div className="flex items-center gap-2.5">
                  <MessageSquare size={16} />
                  <span>Messages</span>
                </div>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white px-2 py-0.5 text-xs font-bold rounded-full">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {!isClientAdmin && (
                <button
                  type="button"
                  className="admin-header-mobile-btn"
                  onClick={() => {
                    navigate('/admin/clients');
                    setMobileMenuOpen(false);
                  }}
                >
                  <Building2 size={16} />
                  <span>Clients</span>
                </button>
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
                className="admin-header-mobile-btn"
                onClick={() => {
                  navigate(`${basePath}/settings`);
                  setMobileMenuOpen(false);
                }}
              >
                <Settings size={16} />
                <span>Settings</span>
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
        </header>
      </div>

      {/* Toast Notification */}
      {toastNotification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div
            className="bg-white rounded-xl shadow-2xl border border-gray-100 p-4 max-w-sm cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => {
              setToastNotification(null);
              navigate(`${basePath}/student-messages`);
            }}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-shnoor-indigo/10 rounded-full flex items-center justify-center flex-shrink-0">
                <MessageSquare size={18} className="text-shnoor-indigo" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-shnoor-navy">
                  New Message from {toastNotification.studentName || 'Student'}
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
