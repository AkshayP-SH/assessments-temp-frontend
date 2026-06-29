import { useState, useEffect } from 'react';

/**
 * useDebounce — delays updating `value` until after `delay` ms of inactivity.
 *
 * Usage:
 *   const debouncedSearch = useDebounce(searchTerm, 300);
 *   useEffect(() => { ... }, [debouncedSearch]);
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
