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
        className={`flex items-center justify-between gap-1.5 sm:gap-2 px-3 py-2 w-full text-xs sm:text-sm border border-theme-stroke rounded-lg focus:ring-2 focus:ring-theme-accent focus:border-theme-accent bg-theme-hdr cursor-pointer hover:border-theme-accent transition-all shadow-sm font-bold text-theme-inv-text min-h-[38px] ${buttonClassName}`}
      >
        <span className="truncate text-left">{selectedOption?.label || placeholder}</span>
        <ChevronDown className={`text-[#8F8FC4] transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} size={15} />
      </button>

      {isOpen && (
        <div
          id={dropdownId}
          role="listbox"
          aria-label={placeholder}
          className={`absolute top-full left-0 mt-1 w-full min-w-full max-w-[calc(100vw-32px)] bg-theme-hdr border border-theme-stroke rounded-xl shadow-xl z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto ${menuClassName}`}
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
              className={`w-full text-left px-3 py-2 text-xs sm:text-sm transition-colors flex items-center justify-between ${
                String(value) === String(option.value)
                  ? 'bg-theme-accent text-white font-bold'
                  : 'text-theme-inv-muted hover:bg-theme-accent/50 font-medium'
              } ${activeIndex === options.indexOf(option) ? 'ring-2 ring-inset ring-theme-accent' : ''}`}
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
    <>
      <div className="admin-search-filter-bar">
        {/* Main Controls Row */}
        <div className="admin-search-filter-row">
          {/* Search Bar */}
          <div className="admin-search-input-wrapper">
            <Search size={18} className="admin-search-icon" />
            <input
              type="text"
              placeholder="Search exams..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="admin-search-input"
            />
          </div>

          {/* Controls */}
          <div className="admin-filter-controls">
            {/* Custom Sort Dropdown */}
            <CustomDropdown
              value={sortBy}
              onChange={handleSortChange}
              options={sortOptions}
              placeholder="Sort"
              buttonClassName="admin-dropdown-btn"
            />

            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`admin-filter-btn ${showFilters ? 'admin-filter-btn-active' : ''}`}
            >
              <Filter size={16} />
              <span>Filter</span>
              {activeFilterBadges.length > 0 && !showFilters && (
                <span className="ml-1 px-1.5 py-0.5 bg-shnoor-lavender text-shnoor-indigo text-xs rounded-full font-bold">
                  {activeFilterBadges.length}
                </span>
              )}
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium bg-theme-hdr text-shnoor-danger hover:bg-theme-accent transition-all border border-shnoor-danger shadow-sm flex-shrink-0"
                title="Clear all filters"
              >
                <X size={15} />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {activeFilterBadges.length > 0 && !showFilters && (
          <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-theme-stroke">
            {activeFilterBadges.map((badge) => (
              <span
                key={badge.key}
                className="inline-flex items-center gap-1 px-2 py-1 bg-theme-accent text-white text-xs rounded-md font-bold"
              >
                {badge.label}
              </span>
            ))}
          </div>
        )}

        {showFilters && (
          <div className="flex flex-wrap gap-2 pt-3 mt-3 border-t border-theme-stroke animate-in slide-in-from-top-2 duration-200">
            {showPublishedFilter && (
              <CustomDropdown
                value={filters.published}
                onChange={(val) => handleFilterChange('published', val)}
                options={publishedOptions}
                placeholder="Status"
                buttonClassName="admin-dropdown-btn"
              />
            )}

            {showAttemptedFilter && (
              <CustomDropdown
                value={filters.attempted}
                onChange={(val) => handleFilterChange('attempted', val)}
                options={attemptedOptions}
                placeholder="Attempts"
                buttonClassName="admin-dropdown-btn"
              />
            )}

            {/* Date Filter */}
            <CustomDropdown
              value={filters.dateRange}
              onChange={(val) => handleFilterChange('dateRange', val)}
              options={dateRangeOptions}
              placeholder="Date Range"
              buttonClassName="admin-dropdown-btn"
            />
          </div>
        )}
      </div>

      {resultCount !== undefined && (
        <div className="admin-exams-count-row">
          <span className="admin-exams-count-text">
            Showing {resultCount} {resultCount === 1 ? 'exam' : 'exams'}
          </span>
          <span className="admin-exams-sort-text">
            Sorted by {sortOptions.find(opt => opt.value === sortBy)?.label?.toLowerCase() || 'latest created'}
          </span>
        </div>
      )}
    </>
  );
});

ExamSearchFilter.displayName = 'ExamSearchFilter';

export default ExamSearchFilter;