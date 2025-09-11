import { cn } from "@/lib/utils"
import { DivisionSplitImage } from "@/components/DivisionSplitImage"

interface DriverDisplayProps {
  driver: {
    division: number | null
    division_split: 'Gold' | 'Silver' | null
    driver_number: number | null
    first_name: string | null
    last_name: string | null
  }
  className?: string
  imageSize?: 'xs' | 'sm' | 'md' | 'lg'
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

  const getDriverName = () => {
    const fullName = `${driver.first_name || ''} ${driver.last_name || ''}`.trim()
    return fullName || 'Unknown Driver'
  }

  const getDriverNumber = () => {
    return driver.driver_number ? `#${driver.driver_number}` : ''
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <DivisionSplitImage 
        division={driver.division}
        split={driver.division_split}
        size={imageSize}
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