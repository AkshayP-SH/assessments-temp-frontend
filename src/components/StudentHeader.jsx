import { useNavigate } from 'react-router-dom';
import { LogOut, ArrowLeft } from 'lucide-react';
import OrganizationLogo from './OrganizationLogo';
import ThemeSelector from './ThemeSelector';
import NotificationBell from './notifications/NotificationBell';
import { clearStorageKeepTheme } from '../utils/theme';
import { disconnectNotificationSocket } from '../services/notificationSocket';

export default function StudentHeader({
  studentName: propStudentName,
  studentId: propStudentId,
  institute: propInstitute,
  title = 'SHNOOR Assessments',
  subtitle = 'Student Dashboard',
  showBackButton = false,
  backTo = '/dashboard',
  backLabel = 'Back to Dashboard',
  onBack,
  onLogout,
  showNotifications = true,
  children
}) {
  const navigate = useNavigate();
  const studentName = propStudentName || localStorage.getItem('studentName') || '';
  const studentId = propStudentId || localStorage.getItem('studentId') || '';
  const institute = propInstitute || localStorage.getItem('institute') || '';

  const capitalizeInstitute = (name) => {
    if (!name) return '';
    return name
      .toLowerCase()
      .split(' ')
      .map((word) => {
        if (word === 'shnoor') return 'SHNOOR';
        if (word === 'international') return 'international';
        if (word === 'llc') return 'LLC';
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  };

  const handleLogout = () => {
    disconnectNotificationSocket();
    if (onLogout) {
      onLogout();
      return;
    }
    clearStorageKeepTheme();
    navigate('/login');
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(backTo);
    }
  };

  return (
    <div className="w-full sticky top-0 z-50">
      <header className="student-header w-full h-[58px] sm:h-[68px] shadow-sm sticky top-0 z-50 rounded-none border-b border-gray-200 dark:border-slate-800 bg-white/95 dark:bg-[#1A1A32]/95 backdrop-blur-md">
        <div className="w-full px-3 sm:px-6 h-full flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo and Title */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <div className="site-header-logo w-8 h-8 sm:w-10 sm:h-10 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 bg-white border border-[#D1D1E6] dark:border-transparent shadow-2xs">
              <OrganizationLogo className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0 flex flex-col justify-center">
              <h1 className="admin-header-title font-extrabold text-sm sm:text-lg lg:text-xl leading-tight truncate text-slate-900 dark:text-white tracking-tight">
                {title}
              </h1>
              <p className="admin-header-subtitle text-[10px] sm:text-xs font-semibold text-[#403f75] dark:text-indigo-400 truncate leading-tight mt-0.5">
                {subtitle}
              </p>
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            {showBackButton && (
              <button
                onClick={handleBack}
                className="student-header-back h-8 sm:h-10 px-2.5 sm:px-4 text-xs sm:text-sm font-bold text-[#403f75] dark:text-indigo-300 bg-[#F1F3FB] dark:bg-[#1E1E38] hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700/80 rounded-xl transition-all flex items-center justify-center shadow-2xs active:scale-98 cursor-pointer btn-action-gesture"
                title={backLabel}
              >
                <ArrowLeft size={14} className="sm:mr-1.5" />
                <span className="hidden sm:inline">{backLabel}</span>
              </button>
            )}

            {children}

            {/* Student info (tablet & desktop) */}
            {studentName && (
              <div className="hidden md:flex items-center gap-2.5 mr-1">
                <div className="flex flex-col text-right">
                  <span className="student-header-user-name text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">
                    {studentName}
                  </span>
                  <span className="student-header-user-sub text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {capitalizeInstitute(institute)} {studentId ? `• ID: ${studentId}` : ''}
                  </span>
                </div>
                <div className="student-header-avatar w-9 h-9 rounded-xl bg-gradient-to-br from-[#403F75] to-[#6868AC] text-white font-black text-xs flex items-center justify-center shadow-xs uppercase flex-shrink-0 hover:scale-110 hover:rotate-3 transition-transform duration-300 cursor-pointer">
                  {studentName.split(' ').map(n => n[0]).slice(0, 2).join('') || 'ST'}
                </div>
              </div>
            )}

            {/* Notification Bell */}
            {showNotifications && (
              <NotificationBell
                role="student"
                viewAllPath="/notifications"
                buttonClassName="relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border border-slate-200/90 dark:border-slate-700/80 shadow-2xs transition-all text-slate-600 dark:text-slate-300 bg-slate-100/90 dark:bg-[#1E1E38] hover:bg-white/80 dark:hover:bg-slate-700"
                dropdownClassName="w-72 sm:w-80"
              />
            )}

            {/* Theme toggle */}
            <div className="student-header-theme-shell flex items-center bg-slate-100/90 dark:bg-[#1E1E38] p-0.5 sm:p-1 rounded-xl border border-slate-200/90 dark:border-slate-700/80 shadow-2xs flex-shrink-0">
              <ThemeSelector
                variant="light"
                className="!rounded-lg !w-7.5 !h-7.5 sm:!w-9 sm:!h-9 !p-0 !border-0 !shadow-none !bg-transparent hover:bg-white/80 dark:hover:bg-slate-700 transition-all text-slate-600 dark:text-slate-300"
              />
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="student-header-logout h-8 sm:h-10 px-2.5 sm:px-3.5 text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 bg-rose-50/90 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200/80 dark:border-rose-800/60 rounded-xl transition-all flex items-center justify-center shadow-2xs cursor-pointer flex-shrink-0 active:scale-98 whitespace-nowrap btn-action-gesture"
              title="Logout"
            >
              <LogOut size={14} className="sm:mr-1.5 text-rose-600 dark:text-rose-400" />
              <span className="inline text-xs sm:text-sm">Logout</span>
            </button>
          </div>
        </div>
      </header>
    </div>
  );
}
