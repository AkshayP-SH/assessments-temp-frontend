import React from 'react';
import { BookOpen, Video, Briefcase, FileText } from 'lucide-react';

const STUDENT_TABS = [
  { id: 'tests', label: 'My Tests', icon: BookOpen },
  { id: 'interviews', label: 'Interviews', icon: Video },
  { id: 'job-board', label: 'Job Board', icon: Briefcase },
  { id: 'my-applications', label: 'My Applications', icon: FileText }
];

export default function StudentSidebar({ activeTab, onTabChange, badges = {} }) {
  return (
    <>
      {/* Desktop sidebar rail */}
      <aside
        aria-label="Student Navigation Rail"
        className="hidden lg:flex fixed left-0 top-[60px] sm:top-[68px] bottom-0 w-[72px] hover:w-60 bg-white/95 dark:bg-[#1A1A32]/95 backdrop-blur-xl border-r border-slate-200/90 dark:border-slate-800 z-40 transition-all duration-300 ease-in-out flex-col justify-between py-5 shadow-sm group overflow-hidden select-none"
      >
        <div className="flex flex-col gap-2 w-full px-2.5">
          {STUDENT_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            const badgeCount = badges[tab.id];

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center h-11 px-3 w-full rounded-xl transition-all duration-200 cursor-pointer relative group/item ${
                  isActive
                    ? 'bg-[#403f75] dark:bg-indigo-600 text-white font-bold shadow-md shadow-[#403f75]/25'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/90 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                  <Icon
                    size={19}
                    className={`transition-transform duration-150 group-hover/item:scale-110 ${
                      isActive
                        ? 'text-white'
                        : 'text-slate-500 dark:text-slate-400 group-hover/item:text-slate-800 dark:group-hover/item:text-white'
                    }`}
                  />
                </div>
                <span className="ml-3 opacity-0 max-w-0 group-hover:max-w-[170px] group-hover:opacity-100 transition-all duration-300 ease-out whitespace-nowrap overflow-hidden text-sm font-bold tracking-tight text-left">
                  {tab.label}
                </span>

                {badgeCount != null && badgeCount > 0 && (
                  <span
                    className={`ml-auto px-1.5 py-0.5 text-[10px] font-black rounded-full transition-opacity duration-200 ${
                      isActive
                        ? 'bg-white text-[#403f75]'
                        : 'bg-[#403f75] dark:bg-indigo-600 text-white'
                    } opacity-0 group-hover:opacity-100`}
                  >
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </aside>

      {/* Mobile tabs */}
      <div className="lg:hidden mb-6 w-full">
        <div
          className="bg-white/95 dark:bg-[#1A1A32]/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs inline-flex flex-nowrap items-center gap-1.5 max-w-full overflow-x-auto scrollbar-none"
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
                className={`group inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-[13px] font-semibold rounded-xl transition-all duration-150 whitespace-nowrap flex-shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#403f75] dark:bg-indigo-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/90 dark:hover:bg-slate-800/70'
                }`}
              >
                <Icon
                  size={15}
                  className={`flex-shrink-0 transition-transform duration-150 group-hover:scale-105 ${
                    isActive
                      ? 'text-white'
                      : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white'
                  }`}
                />
                <span>{tab.label}</span>
                {badgeCount != null && badgeCount > 0 && (
                  <span
                    className={`px-1.5 py-0.2 text-[10px] font-black rounded-full ${
                      isActive ? 'bg-white text-[#403f75]' : 'bg-[#403f75] text-white'
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
