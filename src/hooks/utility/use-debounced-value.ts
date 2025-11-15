import { useEffect, useState } from 'react';

/**
 * Hook that debounces a value by delaying its update until after a specified delay.
 *
 * Useful for:
 * - Search inputs (avoid excessive API calls)
 * - Form validation (wait for user to stop typing)
 * - Resize/scroll handlers (throttle expensive operations)
 *
 * @template T - The type of value to debounce
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds before updating the debounced value
 * @returns The debounced value
 *
 * @example
 * ```tsx
 * const [searchQuery, setSearchQuery] = useState('');
 * const debouncedQuery = useDebouncedValue(searchQuery, 300);
 *
 * // API call only triggers after 300ms of no typing
 * const { data } = useSearchFiles(debouncedQuery);
 * ```
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up the timeout to update debounced value after delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup function: cancel the timeout if value changes before delay expires
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
