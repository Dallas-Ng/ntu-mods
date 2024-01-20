import { useEffect, useState } from "react"

/**
 * Hook for debouncing a value.
 *
 * This hook takes an input value and a delay in milliseconds, and returns a debounced value.
 * The debounced value will be updated only after the input value remains unchanged for the specified delay.
 *
 * @param {any} value - The value to debounce.
 * @param {number} delay - The delay in milliseconds before updating the debounced value.
 * @returns {any} - The debounced value.
 */
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}
