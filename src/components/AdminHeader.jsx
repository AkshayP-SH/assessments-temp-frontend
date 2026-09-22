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
        <header className="admin-header">
          <div className="admin-header-container">
            {/* Left: Brand Logo & Title */}
            <div className="admin-header-brand">
              <div className="admin-header-logo">
                <img
                  src={shnoorLogo}
                  alt="Shnoor Logo"
                />
              </div>
              <div>
                <h1 className="admin-header-title">
                  Shnoor Assessment
                </h1>
                <p className="admin-header-subtitle">
                  {isClientPortal ? 'Client Portal' : 'Admin Dashboard'}
                </p>
              </div>
            </div>

            {/* Right Side: Desktop Navigation Actions */}
            <div className="admin-header-actions">
              <ThemeSelector variant="light" />

              <button
                type="button"
                onClick={() => navigate(`${basePath}/student-messages`)}
                className="admin-header-btn"
              >
                <MessageSquare size={16} />
                <span>Messages</span>
                {unreadCount > 0 && (
                  <span className="admin-header-badge">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {!isClientAdmin && (
                <button
                  type="button"
                  onClick={() => navigate('/admin/clients')}
                  className="admin-header-btn"
                >
                  <Building2 size={16} />
                  <span>Clients</span>
                </button>
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
