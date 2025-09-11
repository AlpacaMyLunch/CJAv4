   export function formatDriverName(driver: any): string {
     if (!driver) return 'Unknown Driver'
     const fullName = `${driver.first_name || ''} ${driver.last_name || ''}`.trim()
     const displayName = fullName || driver.short_name || 'Unknown'
     
     if (driver.driver_number) {
       return `#${driver.driver_number} ${displayName}`
     }
     return displayName
   }