import { useState, useRef, useEffect } from 'react';
import { Calendar, Clock, X } from 'lucide-react';

const CustomDateTimePicker = ({ value, onChange, placeholder, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value || null);
  const [viewDate, setViewDate] = useState(value || new Date());
  const [hour, setHour] = useState(value ? value.getHours() : 0);
  const [minute, setMinute] = useState(value ? value.getMinutes() : 0);
  const [inputValue, setInputValue] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    if (value) {
      setSelectedDate(value);
      setViewDate(value);
      setHour(value.getHours());
      setMinute(value.getMinutes());
      setInputValue(formatDateTime(value));
    } else {
      setInputValue('');
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDateTime = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const handleDateSelect = (date) => {
    if (!date) return;
    const newDate = new Date(date);
    newDate.setHours(hour);
    newDate.setMinutes(minute);
    setSelectedDate(newDate);
    setInputValue(formatDateTime(newDate));
  };

  const handleTimeChange = () => {
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      newDate.setHours(hour);
      newDate.setMinutes(minute);
      setSelectedDate(newDate);
      setInputValue(formatDateTime(newDate));
      onChange(newDate);
    }
  };

  const handleApply = () => {
    if (selectedDate) {
      const finalDate = new Date(selectedDate);
      finalDate.setHours(hour);
      finalDate.setMinutes(minute);
      onChange(finalDate);
      setInputValue(formatDateTime(finalDate));
    }
    setIsOpen(false);
  };

  const handleClear = () => {
    setSelectedDate(null);
    setInputValue('');
    onChange(null);
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    
    const match = val.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/);
    if (match) {
      const [, year, month, day, hrs, mins] = match;
      const date = new Date(year, month - 1, day, hrs, mins);
      if (!isNaN(date.getTime())) {
        setSelectedDate(date);
        setViewDate(date);
        setHour(parseInt(hrs));
        setMinute(parseInt(mins));
        onChange(date);
      }
    }
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const days = getDaysInMonth(viewDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onClick={() => !disabled && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-4 py-2.5 pr-20 border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E1E38] text-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all shadow-2xs"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              disabled={disabled}
            >
              <X size={16} className="text-slate-400 dark:text-slate-400" />
            </button>
          )}
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            disabled={disabled}
          >
            <Calendar size={16} className="text-[#403f75] dark:text-indigo-400" />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-2 bg-white dark:bg-[#25254A] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="flex flex-col sm:flex-row">
            <div className="p-4" style={{ width: '320px' }}>
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1))}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  <span className="text-[#403f75] dark:text-indigo-400 font-bold">←</span>
                </button>
                <div className="flex items-center gap-2">
                  <select
                    value={viewDate.getMonth()}
                    onChange={(e) => setViewDate(new Date(viewDate.getFullYear(), parseInt(e.target.value)))}
                    className="px-2 py-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E1E38] text-slate-800 dark:text-white rounded-lg text-xs font-semibold"
                  >
                    {monthNames.map((month, idx) => (
                      <option key={idx} value={idx}>{month}</option>
                    ))}
                  </select>
                  <select
                    value={viewDate.getFullYear()}
                    onChange={(e) => setViewDate(new Date(parseInt(e.target.value), viewDate.getMonth()))}
                    className="px-2 py-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E1E38] text-slate-800 dark:text-white rounded-lg text-xs font-semibold"
                  >
                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1))}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  <span className="text-[#403f75] dark:text-indigo-400 font-bold">→</span>
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map(day => (
                  <div key={day} className="text-center text-xs font-bold text-slate-500 dark:text-slate-400 py-1">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {days.map((date, idx) => {
                  if (!date) {
                    return <div key={idx} className="aspect-square" />;
                  }
                  
                  const isSelected = selectedDate && 
                    date.getDate() === selectedDate.getDate() &&
                    date.getMonth() === selectedDate.getMonth() &&
                    date.getFullYear() === selectedDate.getFullYear();
                  
                  const isToday = date.getTime() === today.getTime();
                  
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleDateSelect(date)}
                      className={`
                        aspect-square flex items-center justify-center rounded-lg text-xs font-bold transition-all cursor-pointer
                        ${isSelected 
                          ? 'bg-[#403f75] dark:bg-indigo-600 text-white shadow-md' 
                          : isToday
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-[#403f75] dark:text-indigo-300 border border-indigo-400'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                        }
                      `}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-[#1E1E38]" style={{ width: '200px' }}>
              <div className="flex items-center gap-2 mb-3">
                <Clock size={16} className="text-[#403f75] dark:text-indigo-400" />
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Time</span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Hour</label>
                  <select
                    value={hour}
                    onChange={(e) => {
                      setHour(parseInt(e.target.value));
                      handleTimeChange();
                    }}
                    className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#25254A] text-slate-800 dark:text-white rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                  >
                    {Array.from({ length: 24 }, (_, i) => i).map(h => (
                      <option key={h} value={h}>{String(h).padStart(2, '0')}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">Minute</label>
                  <select
                    value={minute}
                    onChange={(e) => {
                      setMinute(parseInt(e.target.value));
                      handleTimeChange();
                    }}
                    className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#25254A] text-slate-800 dark:text-white rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                  >
                    {Array.from({ length: 60 }, (_, i) => i).map(m => (
                      <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                    ))}
                  </select>
                </div>

                {selectedDate && (
                  <div className="mt-4 p-2.5 bg-white dark:bg-[#25254A] rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">Selected:</div>
                    <div className="text-xs font-bold text-slate-800 dark:text-white truncate">
                      {formatDateTime(new Date(selectedDate.setHours(hour, minute)))}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleApply}
                className="w-full mt-4 px-4 py-2 bg-[#403f75] hover:bg-[#343360] dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer transition-all"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDateTimePicker;
