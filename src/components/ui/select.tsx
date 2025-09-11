import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  defaultValue?: string
}

interface SelectTriggerProps {
  className?: string
  children: React.ReactNode
  isOpen?: boolean
  setIsOpen?: (open: boolean) => void
}

interface SelectValueProps {
  placeholder?: string
  selectedValue?: string
}

interface SelectContentProps {
  children: React.ReactNode
  className?: string
  isOpen?: boolean
  handleValueChange?: (value: string) => void
}

interface SelectItemProps {
  value: string
  children: React.ReactNode
  className?: string
  handleValueChange?: (value: string) => void
}

const Select = ({ value, onValueChange, children, defaultValue }: SelectProps) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedValue, setSelectedValue] = React.useState(value || defaultValue || "")
  
  const handleValueChange = (newValue: string) => {
    setSelectedValue(newValue)
    onValueChange?.(newValue)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      {React.Children.map(children, child => {
        if (!React.isValidElement(child)) return child
        
        return React.cloneElement(child, {
          ...(child.props || {}),
          isOpen,
          setIsOpen,
          selectedValue,
          handleValueChange,
        } as any)
      })}
    </div>
  )
}

const SelectTrigger = ({ className, children, isOpen, setIsOpen }: SelectTriggerProps) => {
  return (
    <button
      type="button"
      onClick={() => setIsOpen?.(!isOpen)}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  )
}

const SelectValue = ({ placeholder, selectedValue }: SelectValueProps) => {
  return <span>{selectedValue || placeholder}</span>
}

const SelectContent = ({ children, className, isOpen, handleValueChange }: SelectContentProps) => {
  if (!isOpen) return null
  
  return (
    <div className={cn(
      "absolute top-full z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
      className
    )}>
      {React.Children.map(children, child => {
        if (!React.isValidElement(child)) return child
        
        return React.cloneElement(child, {
          ...(child.props || {}),
          handleValueChange
        } as any)
      })}
    </div>
  )
}

const SelectItem = ({ value, children, className, handleValueChange }: SelectItemProps) => {
  return (
    <div
      onClick={() => handleValueChange?.(value)}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        className
      )}
    >
      {children}
    </div>
  )
}

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }