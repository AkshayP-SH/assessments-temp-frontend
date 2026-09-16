import { useLocation } from 'react-router-dom';
import ThemeSelector from './ThemeSelector';

const HIDDEN_ROUTES = new Set(['/', '/login', '/register', '/forgot-password']);

const GlobalThemeSelector = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const isHiddenRoute = HIDDEN_ROUTES.has(pathname) ||
    pathname === '/privacy-policy' ||
    pathname === '/terms-and-conditions' ||
    pathname === '/job-board' ||
    pathname === '/student/my-applications' ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/client') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/test');

  if (isHiddenRoute) return null;

  return (
    <div className="fixed right-4 top-[72px] sm:top-6 sm:right-6 z-[120]">
      <ThemeSelector variant="light" />
    </div>
  );
};

export default GlobalThemeSelector;
