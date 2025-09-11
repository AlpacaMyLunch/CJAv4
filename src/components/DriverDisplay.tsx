import { cn } from "@/lib/utils"

interface DriverDisplayProps {
  driver: {
    division: number | null
    division_split: 'Gold' | 'Silver' | null
    driver_number: number | null
    first_name: string | null
    last_name: string | null
  }
  className?: string
  imageSize?: 'sm' | 'md' | 'lg'
  showNumber?: boolean
  showName?: boolean
}

export function DriverDisplay({ 
  driver, 
  className, 
  imageSize = 'md',
  showNumber = true,
  showName = true 
}: DriverDisplayProps) {
  const getImagePath = () => {
    if (!driver.division || !driver.division_split) {
      return '/sra/driver_not_rated.png'
    }
    
    const divisionSplit = `division_${driver.division}_${driver.division_split.toLowerCase()}`
    return `/sra/${divisionSplit}.png`
  }

  const getImageSizeClass = () => {
    switch (imageSize) {
      case 'sm': return 'w-8 h-8'
      case 'md': return 'w-12 h-12'
      case 'lg': return 'w-16 h-16'
      default: return 'w-12 h-12'
    }
  }

  const getDriverName = () => {
    const fullName = `${driver.first_name || ''} ${driver.last_name || ''}`.trim()
    return fullName || 'Unknown Driver'
  }

  const getDriverNumber = () => {
    return driver.driver_number ? `#${driver.driver_number}` : ''
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <img 
        src={getImagePath()} 
        alt={`Division ${driver.division || 'Not Rated'} ${driver.division_split || ''}`}
        className={cn("object-contain", getImageSizeClass())}
        onError={(e) => {
          // Fallback to driver_not_rated.png if division image doesn't exist
          e.currentTarget.src = '/sra/driver_not_rated.png'
        }}
      />
      
      <div className="flex flex-col min-w-0">
        {showNumber && driver.driver_number && (
          <span className="text-sm font-semibold text-muted-foreground">
            {getDriverNumber()}
          </span>
        )}
        {showName && (
          <span className="font-medium truncate">
            {getDriverName()}
          </span>
        )}
      </div>
    </div>
  )
}