interface Driver {
  first_name?: string | null;
  last_name?: string | null;
  short_name?: string;
  driver_number?: number | null;
}

export function formatDriverName(driver: Driver | null | undefined): string {
  if (!driver) return 'Unknown Driver'
  const fullName = `${driver.first_name || ''} ${driver.last_name || ''}`.trim()
  const displayName = fullName || driver.short_name || 'Unknown'
  
  if (driver.driver_number) {
    return `#${driver.driver_number} ${displayName}`
  }
  return displayName
}