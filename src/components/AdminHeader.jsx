import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Video, LogOut, X, Menu } from 'lucide-react';
import OrganizationLogo from './OrganizationLogo';
import ThemeSelector from './ThemeSelector';
import NotificationBell from './notifications/NotificationBell';
import { disconnectNotificationSocket } from '../services/notificationSocket';

const AdminHeader = ({ viewAsControl, title }) => {
  const navigate = useNavigate();
  const location = useLocation();
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Ask for desktop-notification permission on the first click (used by the bell
  // when the tab is in the background)
  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'default') return undefined;
    const handleClick = () => Notification.requestPermission().catch(() => {});
    document.addEventListener('click', handleClick, { once: true });
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('clientToken');
    localStorage.removeItem('clientUser');
    sessionStorage.removeItem('superAdminSelectedClientId');
    disconnectNotificationSocket();
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
                <OrganizationLogo className="w-full h-full object-contain" />
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

              {/* Notification Bell */}
              <div className="ml-1">
                <NotificationBell role="admin" viewAllPath={`${basePath}/notifications`} />
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
                <NotificationBell
                  role="admin"
                  viewAllPath={`${basePath}/notifications`}
                  showToasts={false}
                  buttonClassName="admin-header-menu-btn relative"
                  iconSize={20}
                  dropdownClassName="w-72"
                />
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

    </>
  );
};

export default AdminHeader;
