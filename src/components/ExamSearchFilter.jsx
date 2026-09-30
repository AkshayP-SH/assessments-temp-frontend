import { useState, useCallback, useRef, useEffect, useId, memo } from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import InputField from './InputField';
import { useDebounce } from '../hooks/useDebounce';

// Custom dropdown component
const CustomDropdown = memo(({
  value,
  onChange,
  options = [],
  placeholder = 'Select',
  className = '',
  buttonClassName = '',
  menuClassName = '',
  minWidth = 'min-w-[130px]'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const dropdownRef = useRef(null);
  const dropdownId = useId();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find(opt => String(opt.value) === String(value)) || options[0];
  const selectedIndex = Math.max(options.findIndex(opt => String(opt.value) === String(value)), 0);

  useEffect(() => {
    if (isOpen) setActiveIndex(selectedIndex);
  }, [isOpen, selectedIndex]);

  const selectOption = (option) => {
    onChange(option.value);
    setIsOpen(false);
  };

  const handleKeyDown = (event) => {
    if (!options.length) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      setIsOpen(false);
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((index) => {
        const direction = event.key === 'ArrowDown' ? 1 : -1;
        return (index + direction + options.length) % options.length;
      });
      return;
    }

    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex(event.key === 'Home' ? 0 : options.length - 1);
      return;
    }

    if ((event.key === 'Enter' || event.key === ' ') && isOpen) {
      event.preventDefault();
      selectOption(options[activeIndex]);
    }
  };

  return (
    <div ref={dropdownRef} className={`relative flex items-center ${minWidth} ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={dropdownId}
        aria-activedescendant={isOpen && options[activeIndex] ? `${dropdownId}-${activeIndex}` : undefined}
        className={`flex items-center justify-between gap-1.5 sm:gap-2 px-3 py-2 w-full text-xs sm:text-sm border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-indigo focus:border-shnoor-indigo bg-white cursor-pointer hover:border-shnoor-indigo transition-all shadow-sm font-bold text-shnoor-navy min-h-[38px] ${buttonClassName}`}
      >
        <span className="truncate text-left">{selectedOption?.label || placeholder}</span>
        <ChevronDown className={`text-shnoor-indigoMedium transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} size={15} />
      </button>

      {isOpen && (
        <div
          id={dropdownId}
          role="listbox"
          aria-label={placeholder}
          className={`absolute top-full left-0 mt-1 w-full min-w-full max-w-[calc(100vw-32px)] bg-white border border-shnoor-mist rounded-xl shadow-xl z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto ${menuClassName}`}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              id={`${dropdownId}-${options.indexOf(option)}`}
              role="option"
              aria-selected={String(value) === String(option.value)}
              tabIndex={-1}
              onClick={() => selectOption(option)}
              onMouseEnter={() => setActiveIndex(options.indexOf(option))}
              className={`w-full text-left px-3 py-2 text-xs sm:text-sm transition-colors flex items-center justify-between ${String(value) === String(option.value)
                  ? 'bg-shnoor-lavender text-shnoor-indigo font-bold'
                  : 'text-shnoor-navy hover:bg-shnoor-lavender/50 font-medium'
                } ${activeIndex === options.indexOf(option) ? 'ring-2 ring-inset ring-shnoor-indigo' : ''}`}
            >
              <span className="truncate">{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

CustomDropdown.displayName = 'CustomDropdown';

const ExamSearchFilter = memo(({
  onSearchChange,
  onFilterChange,
  onSortChange,
  sortOptions = [],
  showPublishedFilter = false,
  showAttemptedFilter = false,
  resultCount = 0,
  initialSearchTerm = '',
  initialFilters = { published: 'all', attempted: 'all', dateRange: 'all' },
  initialSortBy = 'latest'
}) => {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(initialFilters);
  const [sortBy, setSortBy] = useState(initialSortBy);

  const debouncedSearch = useDebounce(searchTerm, 300);

  // Notify parent whenever debounced value settles
  const [prevDebounced, setPrevDebounced] = useState('');
  if (debouncedSearch !== prevDebounced) {
    setPrevDebounced(debouncedSearch);
    onSearchChange(debouncedSearch);
  }

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleFilterChange = useCallback((filterType, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [filterType]: value };
      onFilterChange(newFilters);
      return newFilters;
    });
  }, [onFilterChange]);

  const handleSortChange = useCallback((value) => {
    setSortBy(value);
    onSortChange(value);
  }, [onSortChange]);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    const defaultFilters = { published: 'all', attempted: 'all', dateRange: 'all' };
    setFilters(defaultFilters);
    setSortBy('latest');
    onSearchChange('');
    onFilterChange(defaultFilters);
    onSortChange('latest');
  }, [onSearchChange, onFilterChange, onSortChange]);

  const hasActiveFilters = searchTerm || filters.published !== 'all' || filters.attempted !== 'all' || filters.dateRange !== 'all' || sortBy !== 'latest';

  const getActiveFilterBadges = () => {
    const badges = [];
    if (searchTerm) badges.push({ label: `Search: "${searchTerm}"`, key: 'search' });
    if (filters.published !== 'all') badges.push({ label: `Status: ${filters.published}`, key: 'published' });
    if (filters.attempted !== 'all') badges.push({ label: `Attempt: ${filters.attempted}`, key: 'attempted' });
    if (filters.dateRange !== 'all') badges.push({ label: `Date: ${filters.dateRange}`, key: 'dateRange' });
    if (sortBy !== 'latest') {
      const sortLabel = sortOptions.find(opt => opt.value === sortBy)?.label || sortBy;
      badges.push({ label: `Sort: ${sortLabel}`, key: 'sort' });
    }
    return badges;
  };

  const activeFilterBadges = getActiveFilterBadges();

  const publishedOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'published', label: 'Published' },
    { value: 'draft', label: 'Draft' }
  ];

  const attemptedOptions = [
    { value: 'all', label: 'All Attempts' },
    { value: 'attempted', label: 'Attempted' },
    { value: 'not-attempted', label: 'Not Attempted' },
    { value: 'in-progress', label: 'In Progress' }
  ];

  const dateRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' }
  ];

  return (
    <div className="w-full">
      <div className="bg-white/95 dark:bg-[#1E1E38] p-2.5 sm:p-3 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-2xs">
        {/* Main Controls Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search exams by title, topic..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full h-11 pl-11 pr-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-sm font-medium text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#403f75] transition-all"
            />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Custom Sort Dropdown */}
            <CustomDropdown
              value={sortBy}
              onChange={handleSortChange}
              options={sortOptions}
              placeholder="Sort"
              buttonClassName="!h-11 !px-4 !rounded-xl !bg-slate-50 dark:!bg-slate-800 !border-slate-200/80 dark:!border-slate-700 !text-slate-700 dark:!text-slate-200 !text-sm font-bold hover:!bg-slate-100 dark:hover:!bg-slate-700 transition-all"
            />

            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`h-11 px-4 rounded-xl border text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${showFilters
                  ? 'bg-[#403f75] text-white border-[#403f75] shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700'
                }`}
            >
              <Filter size={16} />
              <span>Filter</span>
              {activeFilterBadges.length > 0 && !showFilters && (
                <span className="ml-0.5 px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900 text-[#403f75] dark:text-indigo-200 text-xs rounded-full font-bold">
                  {activeFilterBadges.length}
                </span>
              )}
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="h-11 px-3.5 text-xs sm:text-sm rounded-xl font-bold bg-red-50 text-red-600 hover:bg-red-100 transition-all border border-red-200 shadow-2xs flex items-center gap-1.5 cursor-pointer flex-shrink-0"
                title="Clear all filters"
              >
                <X size={15} />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {activeFilterBadges.length > 0 && !showFilters && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            {activeFilterBadges.map((badge) => (
              <span
                key={badge.key}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-[#403f75] dark:text-indigo-300 text-xs font-bold rounded-lg border border-indigo-100/80 dark:border-indigo-900/60"
              >
                {badge.label}
              </span>
            ))}
          </div>
        )}

        {showFilters && (
          <div className="flex flex-wrap gap-2.5 pt-3.5 mt-3 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2 duration-200">
            {showPublishedFilter && (
              <CustomDropdown
                value={filters.published}
                onChange={(val) => handleFilterChange('published', val)}
                options={publishedOptions}
                placeholder="Status"
                buttonClassName="!h-10 !px-3.5 !rounded-xl !bg-slate-50 dark:!bg-slate-800 !border-slate-200/80 dark:!border-slate-700 !text-slate-700 dark:!text-slate-200 !text-xs sm:!text-sm font-semibold"
              />
            )}

            {showAttemptedFilter && (
              <CustomDropdown
                value={filters.attempted}
                onChange={(val) => handleFilterChange('attempted', val)}
                options={attemptedOptions}
                placeholder="Attempts"
                buttonClassName="!h-10 !px-3.5 !rounded-xl !bg-slate-50 dark:!bg-slate-800 !border-slate-200/80 dark:!border-slate-700 !text-slate-700 dark:!text-slate-200 !text-xs sm:!text-sm font-semibold"
              />
            )}

            {/* Date Filter */}
            <CustomDropdown
              value={filters.dateRange}
              onChange={(val) => handleFilterChange('dateRange', val)}
              options={dateRangeOptions}
              placeholder="Date Range"
              buttonClassName="!h-10 !px-3.5 !rounded-xl !bg-slate-50 dark:!bg-slate-800 !border-slate-200/80 dark:!border-slate-700 !text-slate-700 dark:!text-slate-200 !text-xs sm:!text-sm font-semibold"
            />
          </div>
        )}
      </div>
    </div>
  );
});

ExamSearchFilter.displayName = 'ExamSearchFilter';

export default ExamSearchFilter;