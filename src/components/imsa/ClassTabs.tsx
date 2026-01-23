import { cn } from '@/lib/utils'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { type ImsaClassWithEntries } from '@/lib/supabase'

interface ClassTabsProps {
  classes: ImsaClassWithEntries[]
  selectedClassId: string | null
  onSelectClass: (classId: string) => void
  className?: string
}

export function ClassTabs({
  classes,
  selectedClassId,
  onSelectClass,
  className
}: ClassTabsProps) {
  if (classes.length === 0) {
    return null
  }

  return (
    <Tabs
      value={selectedClassId || classes[0]?.id}
      onValueChange={onSelectClass}
      className={cn('w-full', className)}
    >
      <TabsList className="w-full justify-start overflow-x-auto">
        {classes.map((cls) => (
          <TabsTrigger key={cls.id} value={cls.id} className="flex items-center gap-2">
            <span>{cls.name}</span>
            <span className="text-xs text-muted-foreground">
              ({cls.entries.length})
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
