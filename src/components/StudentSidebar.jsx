import React, { useState, useEffect } from 'react';
import { BookOpen, Video, Briefcase, FileText, User, ChevronLeft, ChevronRight } from 'lucide-react';

const STUDENT_TABS = [
  { id: 'tests', label: 'My Tests', icon: BookOpen },
  { id: 'interviews', label: 'Interviews', icon: Video },
  { id: 'job-board', label: 'Job Board', icon: Briefcase },
  { id: 'my-applications', label: 'My Applications', icon: FileText },
  { id: 'profile', label: 'My Profile', icon: User }
];

export default function StudentSidebar({ activeTab, onTabChange, badges = {}, onExpandChange }) {
  const [isPinned, setIsPinned] = useState(() => {
    const saved = localStorage.getItem('studentSidebarPinned');
    return saved === null ? true : saved === 'true';
  });
  const [isHovered, setIsHovered] = useState(false);

  const isExpanded = isPinned || isHovered;

  useEffect(() => {
    if (onExpandChange) {
      onExpandChange(isExpanded);
    }
  }, [isExpanded, onExpandChange]);

  const togglePinned = () => {
    setIsPinned(prev => {
      const next = !prev;
      localStorage.setItem('studentSidebarPinned', String(next));
      return next;
    });
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        aria-label="Student Navigation Rail"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`hidden lg:flex fixed left-0 top-[60px] sm:top-[68px] bottom-0 ${isExpanded ? 'w-64' : 'w-[72px]'
          } bg-white/95 dark:bg-[#1A1A32]/95 backdrop-blur-xl border-r border-slate-200/90 dark:border-slate-800 z-40 transition-all duration-300 ease-in-out flex-col py-4 shadow-sm overflow-hidden select-none`}
      >
        {/* Top Control Bar with Collapse Toggle Button */}
        <div className="px-2.5 pb-3 border-b border-slate-200/80 dark:border-slate-800/80 mb-2 flex-shrink-0">
          <button
            type="button"
            onClick={togglePinned}
            className={`w-full flex items-center ${isExpanded ? 'justify-between px-3' : 'justify-center px-0'} h-10 rounded-xl border border-slate-200/90 dark:border-[#383860] bg-slate-100 dark:bg-[#25254A] hover:bg-slate-200 dark:hover:bg-[#303060] text-slate-700 dark:text-white shadow-2xs transition-all duration-200 cursor-pointer group`}
            title={isPinned ? 'Collapse Sidebar' : 'Pin / Expand Sidebar'}
            aria-label={isPinned ? 'Collapse Sidebar' : 'Pin / Expand Sidebar'}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 text-slate-500 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                {isPinned ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
              </div>
              <span
                className={`transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden text-xs font-bold tracking-tight text-slate-700 dark:text-white text-left ${isExpanded ? 'opacity-100 max-w-[130px]' : 'opacity-0 max-w-0 hidden'
                  }`}
              >
                {isPinned ? 'Collapse Menu' : 'Pin Sidebar'}
              </span>
            </div>
            {isExpanded && (
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300 bg-slate-200/80 dark:bg-[#181832] px-1.5 py-0.5 rounded-md flex-shrink-0 uppercase tracking-wider">
                {isPinned ? 'Hide' : 'Pin'}
              </span>
            )}
          </button>
        </div>

        <div className="flex flex-col gap-1.5 w-full px-2.5 overflow-y-auto flex-1 scrollbar-none">
          {STUDENT_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            const badgeCount = badges[tab.id];

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center h-11 px-3 w-full rounded-xl nav-gesture-item cursor-pointer relative group/item ${isActive
                  ? 'bg-gradient-to-r from-[#403f75] to-[#57569b] text-white font-bold shadow-md shadow-[#403f75]/25 translate-x-1'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/90 dark:hover:bg-slate-800/80'
                  }`}
                title={!isExpanded ? tab.label : undefined}
              >
                <div className="w-6 h-6 flex items-center justify-center flex-shrink-0 relative">
                  <Icon
                    size={19}
                    className={`transition-transform duration-200 ${isActive
                      ? 'text-white scale-110'
                      : 'text-slate-500 dark:text-slate-400 group-hover/item:text-slate-800 dark:group-hover/item:text-white group-hover/item:scale-110 group-hover/item:-rotate-3'
                      }`}
                  />
                  {badgeCount != null && badgeCount > 0 && !isExpanded && (
                    <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-[#1A1A32]" />
                  )}
                </div>
                <span
                  className={`ml-3 transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden text-sm font-bold tracking-tight text-left flex items-center justify-between flex-1 ${isExpanded ? 'opacity-100 max-w-[180px]' : 'opacity-0 max-w-0'
                    }`}
                >
                  <span className="truncate">{tab.label}</span>
                  {badgeCount != null && badgeCount > 0 && (
                    <span
                      className={`ml-1.5 px-1.5 py-0.2 text-[10px] font-black rounded-full flex-shrink-0 ${isActive
                        ? 'bg-white text-[#403f75]'
                        : 'bg-[#403f75] dark:bg-indigo-600 text-white'
                        }`}
                    >
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Mobile tabs */}
      <div className="lg:hidden mb-3 w-full overflow-x-auto scrollbar-none">
        <div
          className="bg-white/95 dark:bg-[#1A1A32]/95 backdrop-blur-md p-1 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs inline-flex flex-nowrap items-center gap-1 min-w-max"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {STUDENT_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            const badgeCount = badges[tab.id];

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`group inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-[13px] font-semibold rounded-xl transition-all duration-150 whitespace-nowrap flex-shrink-0 cursor-pointer ${isActive
                  ? 'bg-[#403f75] dark:bg-indigo-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/90 dark:hover:bg-slate-800/70'
                  }`}
              >
                <Icon
                  size={15}
                  className={`flex-shrink-0 transition-transform duration-150 group-hover:scale-105 ${isActive
                    ? 'text-white'
                    : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white'
                    }`}
                />
                <span>{tab.label}</span>
                {badgeCount != null && badgeCount > 0 && (
                  <span
                    className={`px-1.5 py-0.2 text-[10px] font-black rounded-full ${isActive ? 'bg-white text-[#403f75]' : 'bg-[#403f75] text-white'
                      }`}
                  >
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
