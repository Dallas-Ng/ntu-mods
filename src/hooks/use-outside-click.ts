import { useEffect, useRef } from "react"

export const useOutsideClick = (
  ref: React.RefObject<HTMLDivElement | null>,
  callback: () => void
): void => {
  // Held in a ref so the listener always calls the latest callback without
  // re-subscribing on every render (callers typically pass an inline arrow).
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  })

  useEffect(() => {
    /**
     * Alert if clicked on outside of element
     */
    const handleClickOutside = (event: MouseEvent): void => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callbackRef.current()
      }
    }

    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [ref])
}
