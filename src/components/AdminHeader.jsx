import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Video, LogOut, Settings, MessageSquare, X, Menu, Building2 } from 'lucide-react';
import Button from './Button';
import { useSupportSocket } from '../hooks/useSupportSocket';
import { API_URL } from '../config/api';
import shnoorLogo from '../assets/shnoor-logo.png';
import ThemeSelector from './ThemeSelector';

const AdminHeader = ({ title = "Dashboard", userName = "Admin" }) => {
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
      <header className="w-full bg-shnoor-navy h-[60px] sm:h-[72px] shadow-md relative z-50 rounded-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Logo icon */}
            <div className="site-header-logo w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 bg-white">
              <img
                src={shnoorLogo}
                alt="Shnoor Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-white font-bold text-base sm:text-lg leading-tight truncate">Admin Dashboard</h1>
              <p className="site-header-subtitle text-shnoor-light opacity-80 text-[10px] sm:text-xs truncate">MCQ Management System</p>
            </div>
          </div>

          {/* Right Side: Desktop Navigation */}
          <div className="hidden sm:flex items-center gap-4">
            <ThemeSelector />
            <Button
              variant="primary"
              className="admin-header-action !h-10 !px-5 text-sm hover:shadow-[0_0_15px_rgba(107,107,229,0.4)] hover:-translate-y-0.5 transition-all border-0 relative"
              onClick={() => navigate(`${basePath}/student-messages`)}
            >
              <MessageSquare size={16} className="mr-2" />
              <span>Messages</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Button>
            {!isClientAdmin && (
              <Button
                variant="primary"
                className="admin-header-action !h-10 !px-5 text-sm hover:shadow-[0_0_15px_rgba(107,107,229,0.4)] hover:-translate-y-0.5 transition-all border-0"
                onClick={() => navigate('/admin/clients')}
              >
                <Building2 size={16} className="mr-2" />
                <span>Clients</span>
              </Button>
            )}
            <Button
              variant="primary"
              className="admin-header-action !h-10 !px-5 text-sm hover:shadow-[0_0_15px_rgba(107,107,229,0.4)] hover:-translate-y-0.5 transition-all border-0"
              onClick={() => navigate(`${basePath}/live-proctoring`)}
            >
              <Video size={16} className="mr-2" />
              <span>Live Proctoring</span>
            </Button>
            <Button
              variant="primary"
              className="admin-header-action !h-10 !px-5 text-sm hover:shadow-[0_0_15px_rgba(107,107,229,0.4)] hover:-translate-y-0.5 transition-all border-0"
              onClick={() => navigate(`${basePath}/settings`)}
            >
              <Settings size={16} className="mr-2" />
              <span>Settings</span>
            </Button>
            <Button
              variant="secondary"
              className="admin-logout-btn !h-10 !px-5 text-sm bg-transparent hover:bg-white/10 text-white border border-white/20"
              onClick={handleLogout}
            >
              <LogOut size={16} className="mr-2" />
              <span>Logout</span>
            </Button>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="sm:hidden flex items-center gap-2">
            <ThemeSelector />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors relative min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              {!mobileMenuOpen && unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border border-shnoor-navy"></span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="sm:hidden absolute top-[100%] left-1/2 -translate-x-1/2 w-[calc(100%-12px)] max-w-[420px] bg-shnoor-navy border border-white/10 shadow-xl z-40 overflow-hidden rounded-b-xl">
            <div className="flex items-center justify-between px-3 py-3 border-b border-white/10 bg-shnoor-navy">
              <div className="flex items-center gap-2 min-w-0">
                <div className="site-header-logo w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 bg-white">
                  <img src={shnoorLogo} alt="Shnoor Logo" className="w-full h-full object-contain" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-white font-bold text-base leading-tight truncate">Admin Dashboard</h2>
                  <p className="text-[10px] text-shnoor-light opacity-80 truncate">MCQ Management System</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
                aria-label="Close menu"
              >
                <X size={22} />
              </button>
            </div>

            <div className="p-2 flex flex-col gap-2">
              <Button
                variant="primary"
                className="admin-header-action w-full justify-start !h-12 !px-4 text-base border-0 relative rounded-xl"
                onClick={() => {
                  navigate(`${basePath}/student-messages`);
                  setMobileMenuOpen(false);
                }}
              >
                <MessageSquare size={18} className="mr-3" />
                <span>Messages</span>
                {unreadCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white px-2 py-0.5 text-xs font-bold rounded-full">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Button>
              {!isClientAdmin && (
                <Button
                  variant="primary"
                  className="admin-header-action w-full justify-start !h-12 !px-4 text-base border-0 rounded-xl"
                  onClick={() => {
                    navigate('/admin/clients');
                    setMobileMenuOpen(false);
                  }}
                >
                  <Building2 size={18} className="mr-3" />
                  <span>Clients</span>
                </Button>
              )}
              <Button
                variant="primary"
                className="admin-header-action w-full justify-start !h-12 !px-4 text-base border-0 rounded-xl"
                onClick={() => {
                  navigate(`${basePath}/live-proctoring`);
                  setMobileMenuOpen(false);
                }}
              >
                <Video size={18} className="mr-3" />
                <span>Live Proctoring</span>
              </Button>
              <Button
                variant="primary"
                className="admin-header-action w-full justify-start !h-12 !px-4 text-base border-0 rounded-xl"
                onClick={() => {
                  navigate(`${basePath}/settings`);
                  setMobileMenuOpen(false);
                }}
              >
                <Settings size={18} className="mr-3" />
                <span>Settings</span>
              </Button>
              <Button
                variant="secondary"
                className="w-full justify-start !h-12 !px-4 text-base bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl"
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
              >
                <LogOut size={18} className="mr-3" />
                <span>Logout</span>
              </Button>
            </div>
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
