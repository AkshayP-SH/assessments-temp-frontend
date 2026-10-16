import React, { useEffect, useRef, useState } from 'react';
import { applyTheme, getSavedTheme } from '../utils/theme';

const SunIcon = ({ className = "w-5 h-5", style = {} }) => (
  <svg className={className} style={style} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
  </svg>
);

const MoonIcon = ({ className = "w-5 h-5", style = {} }) => (
  <svg className={className} style={style} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
  </svg>
);

const LeafIcon = ({ className = "w-5 h-5", style = {} }) => (
  <svg className={className} style={style} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
  </svg>
);

const THEMES = [
  { id: 'default', label: 'Light', Icon: SunIcon },
  { id: 'dark', label: 'Dark', Icon: MoonIcon },
  { id: 'green', label: 'Leaf', Icon: LeafIcon },
];

const ThemeSelector = ({ className = '', variant = 'dark' }) => {
  const [theme, setTheme] = useState(getSavedTheme);
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const handleThemeChange = (event) => {
      const nextTheme = event.detail?.theme || getSavedTheme();
      setTheme(nextTheme);
    };

    const handleStorage = (event) => {
      if (event.key === 'app-theme' || event.key === 'shnoor-theme') {
        setTheme(getSavedTheme());
      }
    };

    const handleOutsideClick = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    window.addEventListener('themechange', handleThemeChange);
    window.addEventListener('storage', handleStorage);
    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      window.removeEventListener('themechange', handleThemeChange);
      window.removeEventListener('storage', handleStorage);
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const trigger = triggerRef.current;
      const menu = menuRef.current;
      if (!trigger || !menu) return;

      const rect = trigger.getBoundingClientRect();
      const menuWidth = menu.offsetWidth;
      const menuHeight = menu.offsetHeight;
      const margin = 8;
      const gap = 8;

      let left = rect.right - menuWidth;
      left = Math.max(margin, Math.min(left, window.innerWidth - menuWidth - margin));

      let top = rect.bottom + gap;
      if (top + menuHeight > window.innerHeight - margin) {
        top = Math.max(margin, rect.top - menuHeight - gap);
      }

      setMenuPosition({ top, left });
    };

    requestAnimationFrame(updatePosition);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  const ActiveIcon = theme === 'dark' ? MoonIcon : (theme === 'green' || theme === 'leaf') ? LeafIcon : SunIcon;

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={`theme-selector-trigger theme-selector-trigger--${variant} flex items-center justify-center rounded-xl outline-none focus:outline-none transition-all ${className || 'h-10 w-10 sm:h-11 sm:w-11 min-w-[40px] min-h-[40px]'}`}
        aria-label="Change theme"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        title="Change theme"
      >
        <ActiveIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.2]" />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          style={{ top: menuPosition.top, left: menuPosition.left }}
          className={`theme-selector-menu fixed z-50 flex gap-1 rounded-2xl p-1.5 shadow-2xl border ${
            theme === 'dark'
              ? 'bg-[#1E1E38] border-slate-700 text-slate-300'
              : (theme === 'green' || theme === 'leaf')
              ? 'bg-white border-[#C8D8CE] text-[#111827]'
              : 'bg-white border-slate-200 text-[#111827]'
          }`}
        >
          {THEMES.map((themeOption) => {
            const { id, label } = themeOption;
            const isActive = theme === id || (id === 'green' && theme === 'leaf');

            let activeBg = '#403F75';
            if (theme === 'green' || theme === 'leaf') {
              activeBg = '#235D43';
            } else if (theme === 'dark') {
              activeBg = '#6366F1';
            }

            const iconStrokeColor = isActive
              ? '#FFFFFF'
              : theme === 'dark'
              ? '#CBD5E1'
              : '#111827';

            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setTheme(id);
                  applyTheme(id);
                  setIsOpen(false);
                }}
                aria-label={label}
                title={label}
                style={{
                  backgroundColor: isActive ? activeBg : 'transparent',
                  color: iconStrokeColor,
                }}
                className={`theme-selector-option flex h-10 w-10 items-center justify-center rounded-xl outline-none focus:outline-none transition-all cursor-pointer ${
                  isActive ? 'is-active shadow-sm' : 'hover:bg-slate-100 dark:hover:bg-white/10'
                }`}
              >
                <themeOption.Icon
                  className="w-5 h-5"
                  style={{
                    stroke: iconStrokeColor,
                    strokeWidth: '2.5px',
                    color: iconStrokeColor,
                  }}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ThemeSelector;
