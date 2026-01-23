import { useState, useEffect } from 'react'

/**
 * Hook to detect if the user is on a touch-primary device.
 * Returns true for phones/tablets, false for desktop with mouse.
 */
export function useIsTouchDevice(): boolean {
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  useEffect(() => {
    // Check for coarse pointer (touch screen) as primary input
    const mediaQuery = window.matchMedia('(pointer: coarse)')

    setIsTouchDevice(mediaQuery.matches)

    // Listen for changes (e.g., when connecting/disconnecting devices)
    const handler = (e: MediaQueryListEvent) => {
      setIsTouchDevice(e.matches)
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  return isTouchDevice
}
