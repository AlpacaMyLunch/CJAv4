/**
 * Date formatting utilities
 *
 * Centralized date formatting functions to ensure consistency across the application.
 */

/**
 * Format a date to a localized date string
 * @param date - Date string, Date object, or timestamp
 * @returns Formatted date string (e.g., "1/15/2024" or "15/1/2024" depending on locale)
 *
 * @example
 * formatDate('2024-01-15') // "1/15/2024" (en-US)
 * formatDate(new Date()) // "1/15/2024" (en-US)
 */
export function formatDate(date: string | Date | number): string {
  return new Date(date).toLocaleDateString()
}

/**
 * Format a date to a short date string (e.g., "Jan 15")
 * @param date - Date string, Date object, or timestamp
 * @returns Formatted short date string (e.g., "Jan 15")
 *
 * @example
 * formatShortDate('2024-01-15') // "Jan 15"
 * formatShortDate(new Date()) // "Jan 15"
 */
export function formatShortDate(date: string | Date | number): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Format a date to a long date string (e.g., "January 15, 2024")
 * @param date - Date string, Date object, or timestamp
 * @returns Formatted long date string
 *
 * @example
 * formatDateLong('2024-01-15') // "January 15, 2024"
 */
export function formatDateLong(date: string | Date | number): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

/**
 * Format a date to a localized time string
 * @param date - Date string, Date object, or timestamp
 * @returns Formatted time string (e.g., "2:30:00 PM")
 *
 * @example
 * formatTime('2024-01-15T14:30:00') // "2:30:00 PM"
 */
export function formatTime(date: string | Date | number): string {
  return new Date(date).toLocaleTimeString()
}

/**
 * Format a date to a short time string without seconds (e.g., "2:30 PM")
 * @param date - Date string, Date object, or timestamp
 * @returns Formatted short time string
 *
 * @example
 * formatShortTime('2024-01-15T14:30:00') // "2:30 PM"
 */
export function formatShortTime(date: string | Date | number): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  })
}

/**
 * Format a date to include both date and time
 * @param date - Date string, Date object, or timestamp
 * @returns Formatted date and time string (e.g., "1/15/2024 at 2:30:00 PM")
 *
 * @example
 * formatDateTime('2024-01-15T14:30:00') // "1/15/2024 at 2:30:00 PM"
 */
export function formatDateTime(date: string | Date | number): string {
  const dateObj = new Date(date)
  return `${dateObj.toLocaleDateString()} at ${dateObj.toLocaleTimeString()}`
}

/**
 * Format a date to include date and short time (without seconds)
 * @param date - Date string, Date object, or timestamp
 * @returns Formatted date and time string (e.g., "1/15/2024 at 2:30 PM")
 *
 * @example
 * formatDateTimeShort('2024-01-15T14:30:00') // "1/15/2024 at 2:30 PM"
 */
export function formatDateTimeShort(date: string | Date | number): string {
  const dateObj = new Date(date)
  return `${dateObj.toLocaleDateString()} at ${formatShortTime(dateObj)}`
}

/**
 * Format a date relative to now (e.g., "2 days ago", "in 3 hours")
 * @param date - Date string, Date object, or timestamp
 * @returns Relative time string
 *
 * @example
 * formatRelativeTime('2024-01-13') // "2 days ago" (if today is Jan 15)
 */
export function formatRelativeTime(date: string | Date | number): string {
  const now = new Date()
  const then = new Date(date)
  const diffInMs = now.getTime() - then.getTime()
  const diffInSeconds = Math.floor(diffInMs / 1000)
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  const diffInHours = Math.floor(diffInMinutes / 60)
  const diffInDays = Math.floor(diffInHours / 24)

  if (diffInDays > 0) {
    return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`
  } else if (diffInDays < 0) {
    const absDays = Math.abs(diffInDays)
    return absDays === 1 ? 'in 1 day' : `in ${absDays} days`
  } else if (diffInHours > 0) {
    return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`
  } else if (diffInHours < 0) {
    const absHours = Math.abs(diffInHours)
    return absHours === 1 ? 'in 1 hour' : `in ${absHours} hours`
  } else if (diffInMinutes > 0) {
    return diffInMinutes === 1 ? '1 minute ago' : `${diffInMinutes} minutes ago`
  } else if (diffInMinutes < 0) {
    const absMinutes = Math.abs(diffInMinutes)
    return absMinutes === 1 ? 'in 1 minute' : `in ${absMinutes} minutes`
  } else {
    return 'just now'
  }
}

/**
 * Check if a date is in the past
 * @param date - Date string, Date object, or timestamp
 * @returns True if the date is in the past
 *
 * @example
 * isPast('2020-01-01') // true
 * isPast('2030-01-01') // false
 */
export function isPast(date: string | Date | number): boolean {
  return new Date(date).getTime() < Date.now()
}

/**
 * Check if a date is in the future
 * @param date - Date string, Date object, or timestamp
 * @returns True if the date is in the future
 *
 * @example
 * isFuture('2020-01-01') // false
 * isFuture('2030-01-01') // true
 */
export function isFuture(date: string | Date | number): boolean {
  return new Date(date).getTime() > Date.now()
}

/**
 * Check if a date is today
 * @param date - Date string, Date object, or timestamp
 * @returns True if the date is today
 *
 * @example
 * isToday(new Date()) // true
 * isToday('2020-01-01') // false
 */
export function isToday(date: string | Date | number): boolean {
  const today = new Date()
  const dateObj = new Date(date)
  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  )
}
