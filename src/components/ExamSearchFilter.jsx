import { useState, useCallback, useRef, useEffect, memo } from 'react';
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
  const dropdownRef = useRef(null);

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

  return (
    <div ref={dropdownRef} className={`relative flex items-center ${minWidth} ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`flex items-center justify-between gap-1.5 sm:gap-2 px-3 py-2 w-full text-xs sm:text-sm border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-indigo focus:border-shnoor-indigo bg-white cursor-pointer hover:border-shnoor-indigo transition-all shadow-sm font-bold text-shnoor-navy min-h-[38px] ${buttonClassName}`}
      >
        <span className="truncate text-left">{selectedOption?.label || placeholder}</span>
        <ChevronDown className={`text-shnoor-indigoMedium transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} size={15} />
      </button>

      {isOpen && (
        <div className={`absolute top-full left-0 mt-1 w-full min-w-full max-w-[calc(100vw-32px)] bg-white border border-shnoor-mist rounded-xl shadow-xl z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto ${menuClassName}`}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-xs sm:text-sm transition-colors flex items-center justify-between ${
                String(value) === String(option.value)
                  ? 'bg-shnoor-lavender text-shnoor-indigo font-bold'
                  : 'text-shnoor-navy hover:bg-shnoor-lavender/50 font-medium'
              }`}
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

  // Debounce search so onSearchChange fires 300ms after user stops typing
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
    <div className="bg-white rounded-xl border border-shnoor-mist p-3 mb-4 shadow-[0_8px_30px_rgba(14,14,39,0.06)] relative">
      {/* Main Controls Row */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Search Bar */}
        <div className="flex-1 relative group min-w-0">
          <div className="absolute left-3 top-3.5 text-shnoor-navy group-focus-within:text-shnoor-indigo transition-colors z-10 w-5 h-5 pointer-events-none">
            <Search size={18} />
          </div>
          <InputField
            type="text"
            placeholder="Search exams..."
            value={searchTerm}
            onChange={handleSearchChange}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto min-w-0">
          {/* Custom Sort Dropdown */}
          <CustomDropdown
            value={sortBy}
            onChange={handleSortChange}
            options={sortOptions}
            placeholder="Sort"
            minWidth="flex-1 sm:flex-none min-w-0 sm:min-w-[150px]"
          />

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm rounded-lg font-bold transition-all whitespace-nowrap shadow-sm flex-shrink-0 min-h-[38px] ${showFilters
              ? 'bg-shnoor-indigo text-white shadow-md'
              : 'bg-white text-shnoor-navy hover:bg-shnoor-lavender border border-shnoor-mist hover:border-shnoor-indigo'
              }`}
          >
            <Filter size={16} />
            <span className="hidden sm:inline">Filter</span>
            {activeFilterBadges.length > 0 && !showFilters && (
              <span className="ml-1 px-1.5 py-0.5 bg-shnoor-lavender text-shnoor-indigo text-xs rounded-full font-bold">
                {activeFilterBadges.length}
              </span>
            )}
          </button>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm rounded-lg font-medium bg-white text-shnoor-danger hover:bg-shnoor-dangerLight transition-all border border-shnoor-dangerLight shadow-sm flex-shrink-0 min-h-[38px]"
              title="Clear all filters"
            >
              <X size={16} />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Badges */}
      {activeFilterBadges.length > 0 && !showFilters && (
        <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-shnoor-mist">
          {activeFilterBadges.map((badge) => (
            <span
              key={badge.key}
              className="inline-flex items-center gap-1 px-2 py-1 bg-shnoor-lavender text-shnoor-indigo text-xs rounded-md font-bold"
            >
              {badge.label}
            </span>
          ))}
        </div>
      )}

      {/* Expanded Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 pt-3 mt-3 border-t border-shnoor-mist animate-in slide-in-from-top-2 duration-200">
          {/* Published/Draft Filter */}
          {showPublishedFilter && (
            <CustomDropdown
              value={filters.published}
              onChange={(val) => handleFilterChange('published', val)}
              options={publishedOptions}
              placeholder="Status"
              minWidth="w-full sm:w-auto flex-1 sm:flex-none min-w-0 sm:min-w-[130px]"
            />
          )}

          {/* Attempted Filter */}
          {showAttemptedFilter && (
            <CustomDropdown
              value={filters.attempted}
              onChange={(val) => handleFilterChange('attempted', val)}
              options={attemptedOptions}
              placeholder="Attempts"
              minWidth="w-full sm:w-auto flex-1 sm:flex-none min-w-0 sm:min-w-[140px]"
            />
          )}

          {/* Date Filter */}
          <CustomDropdown
            value={filters.dateRange}
            onChange={(val) => handleFilterChange('dateRange', val)}
            options={dateRangeOptions}
            placeholder="Date Range"
            minWidth="w-full sm:w-auto flex-1 sm:flex-none min-w-0 sm:min-w-[130px]"
          />
        </div>
      )}

      {/* Result Count */}
      {resultCount !== undefined && (
        <div className="mt-2 pt-2 border-t border-shnoor-mist">
          <p className="text-xs text-shnoor-indigoMedium font-bold">
            Showing <span className="text-shnoor-indigo font-bold">{resultCount}</span> {resultCount === 1 ? 'exam' : 'exams'}
          </p>
        </div>
      )}
    </div>
  );
});

ExamSearchFilter.displayName = 'ExamSearchFilter';

export default ExamSearchFilter;