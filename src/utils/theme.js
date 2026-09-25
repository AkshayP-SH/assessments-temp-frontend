export const VALID_THEMES = ['default', 'dark', 'green', 'leaf'];

export const getSavedTheme = () => {
  if (typeof window === 'undefined') return 'default';

  const storedTheme = localStorage.getItem('app-theme') || localStorage.getItem('shnoor-theme') || 'default';
  const resolved = storedTheme === 'leaf' ? 'green' : storedTheme;
  return VALID_THEMES.includes(resolved) ? resolved : 'default';
};

export const applyTheme = (requestedTheme) => {
  if (typeof document === 'undefined') return 'default';

  const normalized = requestedTheme === 'leaf' ? 'green' : requestedTheme;
  const theme = VALID_THEMES.includes(normalized) ? normalized : 'default';

  if (theme === 'default') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem('app-theme', theme);
    localStorage.setItem('shnoor-theme', theme);
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
  }

  return theme;
};

export const clearStorageKeepTheme = () => {
  if (typeof window === 'undefined') return;
  const appTheme = localStorage.getItem('app-theme');
  const shnoorTheme = localStorage.getItem('shnoor-theme');
  localStorage.clear();
  if (appTheme) localStorage.setItem('app-theme', appTheme);
  if (shnoorTheme) localStorage.setItem('shnoor-theme', shnoorTheme);
};