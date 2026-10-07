import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce any fast-changing value (e.g. search inputs)
 * @param value The value to debounce
 * @param delay Milliseconds to delay updating the debounced value
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
