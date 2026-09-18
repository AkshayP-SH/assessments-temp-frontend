
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
          className="w-full px-4 py-3 pr-20 border-2 border-shnoor-light rounded-lg focus:ring-2 focus:ring-shnoor-lavender focus:border-shnoor-indigo transition-all text-sm"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              disabled={disabled}
            >
              <X size={16} className="text-gray-400" />
            </button>
          )}
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            disabled={disabled}
          >
            <Calendar size={16} className="text-shnoor-indigo" />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-2 bg-white border-2 border-shnoor-light rounded-xl shadow-2xl overflow-hidden">
          <div className="flex">
            <div className="p-4" style={{ width: '320px' }}>
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1))}
                  className="p-2 hover:bg-shnoor-lavender rounded-lg transition-colors"
                >
                  <span className="text-shnoor-indigo font-bold">←</span>
                </button>
                <div className="flex items-center gap-2">
                  <select
                    value={viewDate.getMonth()}
                    onChange={(e) => setViewDate(new Date(viewDate.getFullYear(), parseInt(e.target.value)))}
                    className="px-2 py-1 border border-shnoor-light rounded text-sm font-semibold text-shnoor-navy"
                  >
                    {monthNames.map((month, idx) => (
                      <option key={idx} value={idx}>{month}</option>
                    ))}
                  </select>
                  <select
                    value={viewDate.getFullYear()}
                    onChange={(e) => setViewDate(new Date(parseInt(e.target.value), viewDate.getMonth()))}
                    className="px-2 py-1 border border-shnoor-light rounded text-sm font-semibold text-shnoor-navy"
                  >
                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1))}
                  className="p-2 hover:bg-shnoor-lavender rounded-lg transition-colors"
                >
                  <span className="text-shnoor-indigo font-bold">→</span>
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map(day => (
                  <div key={day} className="text-center text-xs font-semibold text-shnoor-indigoMedium py-1">
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
                        aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all
                        ${isSelected 
                          ? 'bg-shnoor-indigo text-white shadow-md' 
                          : isToday
                            ? 'bg-shnoor-lavender text-shnoor-indigo border-2 border-shnoor-indigo'
                            : 'hover:bg-shnoor-lavender text-shnoor-navy'
                        }
                      `}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-l-2 border-shnoor-light p-4 bg-shnoor-mist" style={{ width: '200px' }}>
              <div className="flex items-center gap-2 mb-3">
                <Clock size={16} className="text-shnoor-indigo" />
                <span className="text-sm font-semibold text-shnoor-navy">Time</span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-shnoor-navy mb-1 block">Hour</label>
                  <select
                    value={hour}
                    onChange={(e) => {
                      setHour(parseInt(e.target.value));
                      handleTimeChange();
                    }}
                    className="w-full px-3 py-2 border-2 border-shnoor-light rounded-lg focus:ring-2 focus:ring-shnoor-indigo text-sm font-medium"
                  >
                    {Array.from({ length: 24 }, (_, i) => i).map(h => (
                      <option key={h} value={h}>{String(h).padStart(2, '0')}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-shnoor-navy mb-1 block">Minute</label>
                  <select
                    value={minute}
                    onChange={(e) => {
                      setMinute(parseInt(e.target.value));
                      handleTimeChange();
                    }}
                    className="w-full px-3 py-2 border-2 border-shnoor-light rounded-lg focus:ring-2 focus:ring-shnoor-indigo text-sm font-medium"
                  >
                    {Array.from({ length: 60 }, (_, i) => i).map(m => (
                      <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                    ))}
                  </select>
                </div>

                {selectedDate && (
                  <div className="mt-4 p-3 bg-white rounded-lg border-2 border-shnoor-light">
                    <div className="text-xs text-shnoor-indigoMedium mb-1">Selected:</div>
                    <div className="text-sm font-semibold text-shnoor-navy">
                      {formatDateTime(new Date(selectedDate.setHours(hour, minute)))}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleApply}
                className="w-full mt-4 px-4 py-2 bg-shnoor-indigo text-white rounded-lg hover:bg-shnoor-navy transition-all font-medium text-sm shadow-md"
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
