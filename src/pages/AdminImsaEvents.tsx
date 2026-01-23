import { useState } from 'react'
import { motion } from 'framer-motion'
import { Settings, Plus, Check, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type {
  ImsaClassInsert,
  ImsaManufacturerInsert,
  ImsaEntryInsert
} from '@/lib/supabase'
import { useToast } from '@/hooks/useToast'
import { useImsaEvents } from '@/hooks/useImsaEvents'
import { useImsaEventData } from '@/hooks/useImsaEventData'
import { AdminGuard } from '@/components/AdminGuard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { showSuccessToast, showErrorToast } from '@/utils/toast'

export function AdminImsaEvents() {
  const { addToast } = useToast()
  const { events, loading: eventsLoading, refetch: refetchEvents } = useImsaEvents()

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('events')
  const [saving, setSaving] = useState(false)

  const { classes, refetch: refetchEventData } = useImsaEventData(selectedEventId)

  // New event form state
  const [newEvent, setNewEvent] = useState({
    name: '',
    year: new Date().getFullYear(),
    track: '',
    green_flag_time: '',
    prediction_deadline: ''
  })

  // Bulk entry paste state
  const [bulkEntryData, setBulkEntryData] = useState('')

  // Create new event
  const handleCreateEvent = async () => {
    if (!newEvent.name.trim()) {
      showErrorToast(addToast, 'Event name is required')
      return
    }

    setSaving(true)

    try {
      const { data, error: insertError } = await supabase
        .from('imsa_events')
        .insert({
          name: newEvent.name,
          year: newEvent.year,
          track: newEvent.track,
          green_flag_time: newEvent.green_flag_time || new Date().toISOString(),
          prediction_deadline: newEvent.prediction_deadline || new Date().toISOString(),
          series: 'IMSA WeatherTech',
          event_type: 'endurance',
          is_active: false
        })
        .select()
        .single()

      if (insertError) throw insertError

      showSuccessToast(addToast, `Event "${newEvent.name}" created successfully!`)
      setNewEvent({
        name: '',
        year: new Date().getFullYear(),
        track: '',
        green_flag_time: '',
        prediction_deadline: ''
      })
      refetchEvents()

      if (data) {
        setSelectedEventId(data.id)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create event'
      showErrorToast(addToast, message)
    }

    setSaving(false)
  }

  // Toggle event active status
  const handleToggleActive = async (eventId: string, currentStatus: boolean) => {
    const { error: updateError } = await supabase
      .from('imsa_events')
      .update({ is_active: !currentStatus })
      .eq('id', eventId)

    if (updateError) {
      showErrorToast(addToast, updateError.message)
    } else {
      showSuccessToast(addToast, 'Event status updated')
      refetchEvents()
    }
  }

  // Create classes for an event (standard IMSA classes)
  const handleCreateStandardClasses = async () => {
    if (!selectedEventId) return
    setSaving(true)

    const standardClasses: ImsaClassInsert[] = [
      { event_id: selectedEventId, name: 'GTP', display_order: 1, has_manufacturer_prediction: true },
      { event_id: selectedEventId, name: 'LMP2', display_order: 2, has_manufacturer_prediction: false },
      { event_id: selectedEventId, name: 'GTD Pro', display_order: 3, has_manufacturer_prediction: true },
      { event_id: selectedEventId, name: 'GTD', display_order: 4, has_manufacturer_prediction: true }
    ]

    try {
      const { error: insertError } = await supabase
        .from('imsa_classes')
        .insert(standardClasses)

      if (insertError) throw insertError

      showSuccessToast(addToast, 'Standard classes created')
      refetchEventData()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create classes'
      showErrorToast(addToast, message)
    }

    setSaving(false)
  }

  // Parse and import bulk entry data
  const handleBulkImport = async () => {
    if (!selectedEventId || !bulkEntryData.trim()) return
    if (classes.length === 0) {
      showErrorToast(addToast, 'Create classes first before importing entries')
      return
    }

    setSaving(true)

    try {
      const lines = bulkEntryData.trim().split('\n')
      const manufacturersToCreate = new Map<string, { class_name: string; name: string }>()
      const entries: Array<{
        car_number: string
        class_name: string
        manufacturer_name: string
        team_name: string
        drivers: string[]
      }> = []

      // Parse lines
      for (const line of lines) {
        const parts = line.split(/[,\t]/).map(p => p.trim())
        if (parts.length < 5) continue

        const [carNum, className, manufacturer, teamName, ...drivers] = parts
        if (!carNum) continue

        entries.push({
          car_number: carNum,
          class_name: className,
          manufacturer_name: manufacturer,
          team_name: teamName,
          drivers: drivers.filter(d => d)
        })

        const key = `${className}|${manufacturer}`
        if (!manufacturersToCreate.has(key)) {
          manufacturersToCreate.set(key, { class_name: className, name: manufacturer })
        }
      }

      // Get class IDs
      const classMap = new Map(classes.map(c => [c.name, c.id]))

      // Create manufacturers
      const manufacturerInserts: ImsaManufacturerInsert[] = []
      for (const [, mfr] of manufacturersToCreate) {
        const classId = classMap.get(mfr.class_name)
        if (classId) {
          manufacturerInserts.push({
            event_id: selectedEventId,
            class_id: classId,
            name: mfr.name
          })
        }
      }

      if (manufacturerInserts.length > 0) {
        const { error: mfrError } = await supabase
          .from('imsa_manufacturers')
          .upsert(manufacturerInserts, { onConflict: 'event_id,class_id,name' })
        if (mfrError) throw mfrError
      }

      // Get fresh manufacturer data
      const { data: freshManufacturers } = await supabase
        .from('imsa_manufacturers')
        .select('id, class_id, name')
        .eq('event_id', selectedEventId)

      const mfrMap = new Map(
        freshManufacturers?.map(m => [`${m.class_id}|${m.name}`, m.id]) || []
      )

      // Create entries
      const entryInserts: ImsaEntryInsert[] = []
      for (const entry of entries) {
        const classId = classMap.get(entry.class_name)
        const manufacturerId = mfrMap.get(`${classId}|${entry.manufacturer_name}`)

        if (classId && manufacturerId) {
          entryInserts.push({
            event_id: selectedEventId,
            class_id: classId,
            manufacturer_id: manufacturerId,
            car_number: entry.car_number,
            team_name: entry.team_name,
            drivers: entry.drivers
          })
        }
      }

      if (entryInserts.length > 0) {
        const { error: entryError } = await supabase
          .from('imsa_entries')
          .upsert(entryInserts, { onConflict: 'event_id,car_number' })
        if (entryError) throw entryError
      }

      showSuccessToast(addToast, `Imported ${entryInserts.length} entries`)
      setBulkEntryData('')
      refetchEventData()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to import entries'
      showErrorToast(addToast, message)
    }

    setSaving(false)
  }

  if (eventsLoading) {
    return (
      <AdminGuard>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <LoadingSpinner size="lg" message="Loading..." center />
        </div>
      </AdminGuard>
    )
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Settings className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">IMSA Admin</h1>
            </div>
            <p className="text-muted-foreground">
              Manage events, entries, and results
            </p>
          </motion.div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="entries">Entries</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
            </TabsList>

            {/* Events Tab */}
            <TabsContent value="events" className="space-y-6">
              {/* Create Event Form */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="h-5 w-5" />
                      Create New Event
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Event Name</label>
                        <input
                          type="text"
                          value={newEvent.name}
                          onChange={(e) => setNewEvent(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Rolex 24 at Daytona"
                          className="w-full p-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Year</label>
                        <input
                          type="number"
                          value={newEvent.year}
                          onChange={(e) => setNewEvent(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                          className="w-full p-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Track</label>
                        <input
                          type="text"
                          value={newEvent.track}
                          onChange={(e) => setNewEvent(prev => ({ ...prev, track: e.target.value }))}
                          placeholder="Daytona International Speedway"
                          className="w-full p-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Green Flag (UTC)</label>
                        <input
                          type="datetime-local"
                          value={newEvent.green_flag_time}
                          onChange={(e) => setNewEvent(prev => ({ ...prev, green_flag_time: e.target.value }))}
                          className="w-full p-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-foreground">Prediction Deadline (UTC)</label>
                        <input
                          type="datetime-local"
                          value={newEvent.prediction_deadline}
                          onChange={(e) => setNewEvent(prev => ({ ...prev, prediction_deadline: e.target.value }))}
                          className="w-full p-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                    <Button onClick={handleCreateEvent} disabled={saving || !newEvent.name}>
                      {saving ? 'Creating...' : 'Create Event'}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Existing Events List */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Existing Events</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {events.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No events created yet</p>
                    ) : (
                      <div className="space-y-2">
                        {events.map(event => (
                          <div
                            key={event.id}
                            className={`flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer hover:bg-muted/50 ${
                              selectedEventId === event.id
                                ? 'border-primary bg-primary/5'
                                : 'border-border'
                            }`}
                            onClick={() => setSelectedEventId(event.id)}
                          >
                            <div className="flex-1">
                              <p className="font-medium text-card-foreground flex items-center gap-2">
                                {event.name} ({event.year})
                                {event.is_active && (
                                  <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                    <Check className="h-3 w-3" /> Active
                                  </span>
                                )}
                              </p>
                              <p className="text-sm text-muted-foreground">{event.track}</p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleToggleActive(event.id, event.is_active)
                              }}
                            >
                              {event.is_active ? 'Deactivate' : 'Activate'}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Entries Tab */}
            <TabsContent value="entries" className="space-y-6">
              {!selectedEventId ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    Select an event from the Events tab first
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Classes Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle>Classes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {classes.length === 0 ? (
                          <div className="space-y-4">
                            <p className="text-muted-foreground">No classes defined yet.</p>
                            <Button onClick={handleCreateStandardClasses} disabled={saving}>
                              {saving ? 'Creating...' : 'Create Standard IMSA Classes'}
                            </Button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {classes.map(cls => (
                              <div
                                key={cls.id}
                                className="px-4 py-2 bg-secondary rounded-lg text-sm font-medium"
                              >
                                {cls.name}
                                <span className="ml-2 text-muted-foreground">
                                  ({cls.entries.length} entries)
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Bulk Import */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle>Bulk Import Entries</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Paste entry data with one car per line. Format: car_number, class, manufacturer, team, driver1, driver2, driver3
                        </p>
                        <textarea
                          value={bulkEntryData}
                          onChange={(e) => setBulkEntryData(e.target.value)}
                          placeholder="10, GTP, Cadillac, Wayne Taylor Racing, Ricky Taylor, Filipe Albuquerque, Will Stevens"
                          rows={8}
                          className="w-full p-3 bg-background border border-border rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary resize-y"
                        />
                        <Button
                          onClick={handleBulkImport}
                          disabled={saving || !bulkEntryData.trim() || classes.length === 0}
                        >
                          {saving ? 'Importing...' : 'Import Entries'}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Current Entries */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle>Current Entries</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {classes.length === 0 ? (
                          <p className="text-muted-foreground text-center py-8">
                            Create classes first to see entries
                          </p>
                        ) : (
                          <div className="space-y-6">
                            {classes.map(cls => (
                              <div key={cls.id}>
                                <h4 className="font-semibold text-card-foreground mb-3">{cls.name}</h4>
                                {cls.entries.length === 0 ? (
                                  <p className="text-sm text-muted-foreground">No entries yet</p>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {cls.entries.map(entry => (
                                      <div
                                        key={entry.id}
                                        className="text-sm p-3 bg-secondary rounded-lg"
                                      >
                                        <span className="font-mono font-bold">#{entry.car_number}</span>
                                        <span className="mx-2">-</span>
                                        <span>{entry.team_name}</span>
                                        <span className="text-muted-foreground ml-2">
                                          ({entry.manufacturer.name})
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </>
              )}
            </TabsContent>

            {/* Results Tab */}
            <TabsContent value="results">
              <Card>
                <CardContent className="py-12 text-center">
                  <X className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-foreground mb-2">Coming Soon</h2>
                  <p className="text-muted-foreground">
                    Results entry will be available after the race. This section will allow you to input
                    finish positions and calculate scores.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminGuard>
  )
}
