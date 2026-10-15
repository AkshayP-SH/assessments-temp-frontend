const INDIA_TIME_ZONE = 'Asia/Kolkata';
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const getDateAndTimeZone = (value) => {
  const isDateOnly = typeof value === 'string' && DATE_ONLY_PATTERN.test(value);
  const date = value instanceof Date
    ? value
    : new Date(isDateOnly ? `${value}T00:00:00Z` : value);

  return {
    date,
    timeZone: isDateOnly ? 'UTC' : INDIA_TIME_ZONE
  };
};

const formatDateValue = (value, locale, options) => {
  if (value === null || value === undefined || value === '') return '';

  const { date, timeZone } = getDateAndTimeZone(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(date);
};

export const formatDate = (value, locale, options) =>
  formatDateValue(value, locale, options);

export const formatDateTime = (value, locale, options) =>
  formatDateValue(value, locale, options);

export const formatTime = (value, locale, options) =>
  formatDateValue(value, locale, options);
