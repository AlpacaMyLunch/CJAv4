import { cn } from "@/lib/utils"
import { DivisionSplitImage } from "@/components/DivisionSplitImage"

interface DivisionSplitLabelProps {
  division: number
  split: 'Gold' | 'Silver'
  className?: string
  imageSize?: 'xs' | 'sm' | 'md' | 'lg'
  showText?: boolean
  textSize?: 'sm' | 'md' | 'lg'
}

export function DivisionSplitLabel({ 
  division, 
  split, 
  className, 
  imageSize = 'sm',
  showText = true,
  textSize = 'sm'
}: DivisionSplitLabelProps) {
  const getTextSizeClass = () => {
    switch (textSize) {
      case 'sm': return 'text-sm'
      case 'md': return 'text-base'
      case 'lg': return 'text-lg'
      default: return 'text-sm'
    }
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <DivisionSplitImage 
        division={division}
        split={split}
        size={imageSize}
      />
      
      {showText && (
        <span className={cn("font-medium", getTextSizeClass())}>
          Division {division} - {split}
        </span>
      )}
    </div>
  )
}