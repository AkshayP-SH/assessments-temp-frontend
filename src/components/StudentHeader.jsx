import { useNavigate } from 'react-router-dom';
import { LogOut, ArrowLeft } from 'lucide-react';
import shnoorLogo from '../assets/shnoor-logo.png';
import ThemeSelector from './ThemeSelector';
import { clearStorageKeepTheme } from '../utils/theme';

export default function StudentHeader({
  studentName = '',
  studentId = '',
  institute = '',
  title = 'Shnoor Assessment',
  subtitle = 'Student Dashboard',
  showBackButton = false,
  backTo = '/dashboard',
  backLabel = 'Back to Dashboard',
  onBack,
  onLogout,
  children
}) {
  const navigate = useNavigate();

  const capitalizeInstitute = (name) => {
    if (!name) return '';
    return name
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleLogout = () => {
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
      <header className="admin-header w-full h-[60px] sm:h-[68px] shadow-sm sticky top-0 z-50 rounded-none border-b border-gray-200 dark:border-slate-800 bg-white/95 dark:bg-[#1A1A32]/95 backdrop-blur-md">
        <div className="w-full px-4 sm:px-6 lg:px-6 h-full flex items-center justify-between gap-4">
          {/* Logo and Title */}
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
                {title}
              </h1>
              <p className="admin-header-subtitle text-xs font-semibold text-[#403f75] dark:text-indigo-400 whitespace-nowrap leading-tight mt-0.5">
                {subtitle}
              </p>
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {showBackButton && (
              <button
                onClick={handleBack}
                className="h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm font-bold text-[#403f75] dark:text-indigo-300 bg-[#F1F3FB] dark:bg-[#1E1E38] hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700/80 rounded-xl transition-all flex items-center justify-center shadow-2xs active:scale-98"
                title={backLabel}
              >
                <ArrowLeft size={15} className="mr-1.5" />
                <span className="hidden sm:inline">{backLabel}</span>
              </button>
            )}

            {children}

            {/* Student info */}
            {studentName && (
              <div className="hidden sm:flex flex-col text-right mr-1">
                <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">
                  Welcome, {studentName}
                </span>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {capitalizeInstitute(institute)} {studentId ? `• ID: ${studentId}` : ''}
                </span>
              </div>
            )}

            {/* Theme toggle */}
            <div className="flex items-center bg-slate-100/90 dark:bg-[#1E1E38] p-1 rounded-xl border border-slate-200/90 dark:border-slate-700/80 shadow-2xs gap-0.5">
              <ThemeSelector
                variant="light"
                className="!rounded-lg !w-9 !h-9 !p-0 !border-0 !shadow-none !bg-transparent hover:bg-white/80 dark:hover:bg-slate-750 transition-all text-slate-600 dark:text-slate-300"
              />
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="h-10 px-4 text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 bg-rose-50/90 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200/80 dark:border-rose-800/60 rounded-xl transition-all flex items-center justify-center shadow-2xs cursor-pointer ml-1 sm:ml-2 flex-shrink-0 active:scale-98 whitespace-nowrap"
              title="Logout"
            >
              <LogOut size={15} className="mr-1.5 text-rose-600 dark:text-rose-400" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>
    </div>
  );
}
