import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Video, LogOut, Settings, MessageSquare, X, Menu, Building2 } from 'lucide-react';
import Button from './Button';
import { useSupportSocket } from '../hooks/useSupportSocket';
import { API_URL } from '../config/api';
import shnoorLogo from '../assets/shnoor-logo.png';
import ThemeSelector from './ThemeSelector';
import toast from 'react-hot-toast';

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
  const [clientPlanId, setClientPlanId] = useState(null);
  const shownNotificationsRef = useRef(new Set());
  const socketCountReceivedRef = useRef(false);

  useEffect(() => {
    if (!isClientAdmin) return;
    const token = localStorage.getItem('adminToken') || localStorage.getItem('clientToken');
    if (!token) return;
    fetch(`${API_URL}/api/client/auth/me`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.success && d.admin) setClientPlanId(d.admin.plan_id); })
      .catch(() => { });
  }, [isClientAdmin]);

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
        const token = localStorage.getItem('clientToken') || localStorage.getItem('adminToken');
        if (!token) return;

        const response = await fetch(`${API_URL}/api/student-messages/unread-count`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401 || response.status === 403) return;

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
                  Shnoor Assessment
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
                  className={`h-9 px-3.5 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center relative ${location.pathname.includes('student-messages')
                    ? 'bg-white dark:bg-[#2A2A4E] text-[#403f75] dark:text-indigo-300 shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-slate-700/60'
                    }`}
                  onClick={() => navigate(`${basePath}/student-messages`)}
                >
                  <MessageSquare size={15} className="mr-2 text-current" />
                  <span>Messages</span>
                  {unreadCount > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.2 bg-red-500 text-white text-[10px] font-black rounded-full">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {!isClientAdmin && (
                  <button
                    className={`h-9 px-3.5 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center relative ${location.pathname.includes('clients')
                      ? 'bg-white dark:bg-[#2A2A4E] text-[#403f75] dark:text-indigo-300 shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-slate-700/60'
                      }`}
                    onClick={() => navigate('/admin/clients')}
                  >
                    <Building2 size={15} className="mr-2 text-current" />
                    <span>Clients</span>
                  </button>
                )}

                <button
                  className={`h-9 px-3.5 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center relative ${location.pathname.includes('live-proctoring')
                    ? 'bg-white dark:bg-[#2A2A4E] text-[#403f75] dark:text-indigo-300 shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-slate-700/60'
                    }`}
                  onClick={() => navigate(`${basePath}/live-proctoring`)}
                >
                  <Video size={15} className="mr-2 text-current" />
                  <span>Live Proctoring</span>
                </button>

                <button
                  className={`h-9 px-3.5 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center relative ${location.pathname.includes('settings')
                    ? 'bg-white dark:bg-[#2A2A4E] text-[#403f75] dark:text-indigo-300 shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-slate-700/60'
                    }`}
                  onClick={() => navigate(`${basePath}/settings`)}
                >
                  <Settings size={15} className="mr-2 text-current" />
                  <span>Settings</span>
                </button>
              </div>

              <button
                className="h-10 px-4 text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 bg-rose-50/90 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200/80 dark:border-rose-800/60 rounded-xl transition-all flex items-center justify-center shadow-2xs cursor-pointer ml-2 flex-shrink-0 active:scale-98 whitespace-nowrap"
                onClick={handleLogout}
                title="Logout from admin"
              >
                <LogOut size={15} className="mr-1.5 text-rose-600 dark:text-rose-400" />
                <span>Logout</span>
              </button>
            </div>


            {/* Mobile Menu Toggle Button */}
            <div className="sm:hidden flex items-center gap-2 flex-shrink-0">
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
                {viewAsControl && (
                  <div className="p-3 mb-2 bg-[#F1F3FB] dark:bg-[#1E1E38] rounded-xl">
                    {viewAsControl}
                  </div>
                )}
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
          </div>
        </header>
      </div>

  {/* Toast Notification */ }
{
  toastNotification && (
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
  )
}
    </>
  );
};

export default AdminHeader;
