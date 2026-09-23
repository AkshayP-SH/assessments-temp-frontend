import React, { useEffect, useRef, useState } from 'react';
import { Leaf, Moon, Sun } from 'lucide-react';
import { applyTheme, getSavedTheme } from '../utils/theme';

const THEMES = [
  { id: 'default', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'green', label: 'Green', icon: Leaf },
];

const ThemeSelector = ({ className = '', variant = 'dark' }) => {
  const [theme, setTheme] = useState(getSavedTheme);
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
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

    window.addEventListener('storage', handleStorage);
    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
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

  const ActiveIcon = theme === 'dark' ? Moon : theme === 'green' ? Leaf : Sun;

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={`theme-selector-trigger theme-selector-trigger--${variant} flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl outline-none focus:outline-none transition-all ${className}`}
        aria-label="Change theme"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        title="Change theme"
      >
        <ActiveIcon size={18} className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          style={{ top: menuPosition.top, left: menuPosition.left }}
          className="theme-selector-menu fixed z-50 flex gap-1 rounded-2xl p-1.5 shadow-xl"
        >
          {THEMES.map((themeOption) => {
            const { id, label } = themeOption;
            const isActive = theme === id;

            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setTheme(id);
                  setIsOpen(false);
                }}
                aria-label={label}
                title={label}
                className={`theme-selector-option flex h-10 w-10 items-center justify-center rounded-xl outline-none focus:outline-none transition-colors ${isActive ? 'is-active' : ''}`}
              >
                <themeOption.icon size={17} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ThemeSelector;
