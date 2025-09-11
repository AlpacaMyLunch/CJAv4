import { cn } from "@/lib/utils"

interface DivisionSplitImageProps {
  division: number | null
  split: 'Gold' | 'Silver' | null
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

export function DivisionSplitImage({ 
  division, 
  split, 
  size = 'md', 
  className 
}: DivisionSplitImageProps) {
  const getImagePath = () => {
    if (!division || !split) {
      return '/sra/driver_not_rated.png'
    }
    
    const divisionSplit = `division_${division}_${split.toLowerCase()}`
    return `/sra/${divisionSplit}.png`
  }

  const getSizeClass = () => {
    switch (size) {
      case 'xs': return 'w-6 h-6'
      case 'sm': return 'w-8 h-8'
      case 'md': return 'w-12 h-12'
      case 'lg': return 'w-16 h-16'
      default: return 'w-12 h-12'
    }
  }

  const getAltText = () => {
    if (!division || !split) {
      return 'Driver Not Rated'
    }
    return `Division ${division} ${split}`
  }

  return (
    <img 
      src={getImagePath()} 
      alt={getAltText()}
      className={cn("object-contain", getSizeClass(), className)}
      onError={(e) => {
        // Fallback to driver_not_rated.png if division image doesn't exist
        e.currentTarget.src = '/sra/driver_not_rated.png'
      }}
    />
  )
}