import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings, Plus, Check, AlertCircle, Calculator, Users, BarChart3, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type {
  ImsaClassInsert,
  ImsaManufacturerInsert,
  ImsaEntryInsert,
  ImsaClassWithEntries,
  ImsaEntryResult,
  ImsaEntryStatus
} from '@/lib/supabase'
import { useToast } from '@/hooks/useToast'
import { useImsaEvents } from '@/hooks/useImsaEvents'
import { useImsaEventData } from '@/hooks/useImsaEventData'
import { AdminGuard } from '@/components/AdminGuard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { showSuccessToast, showErrorToast } from '@/utils/toast'
import { calculateImsaScores } from '@/utils/calculateImsaScores'

// Results Entry Form Component
interface ResultsEntryFormProps {
  classData: ImsaClassWithEntries
  eventId: string
  onSave: () => void
}

function ResultsEntryForm({ classData, eventId, onSave }: ResultsEntryFormProps) {
  const [results, setResults] = useState<Record<string, {
    finish_position: number | null
    status: ImsaEntryStatus
    laps_completed: number | null
  }>>({})
  const [saving, setSaving] = useState(false)
  const [existingResults, setExistingResults] = useState<ImsaEntryResult[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch existing results on mount
  useEffect(() => {
    const fetchExisting = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('imsa_entry_results')
        .select('*')
        .eq('event_id', eventId)
        .in('entry_id', classData.entries.map(e => e.id))

      if (!error && data) {
        setExistingResults(data)
        // Pre-populate form
        const initial: Record<string, {
          finish_position: number | null
          status: ImsaEntryStatus
          laps_completed: number | null
        }> = {}
        data.forEach(r => {
          initial[r.entry_id] = {
            finish_position: r.finish_position,
            status: r.status,
            laps_completed: r.laps_completed
          }
        })
        setResults(prev => ({ ...prev, ...initial }))
      }
      setLoading(false)
    }
    fetchExisting()
  }, [eventId, classData.entries])

  const handleSave = async () => {
    setSaving(true)

    const resultsToUpsert = classData.entries
      .filter(entry => results[entry.id]?.finish_position != null)
      .map(entry => ({
        event_id: eventId,
        entry_id: entry.id,
        finish_position: results[entry.id].finish_position,
        status: results[entry.id].status || 'finished',
        laps_completed: results[entry.id].laps_completed
      }))

    const { error } = await supabase
      .from('imsa_entry_results')
      .upsert(resultsToUpsert, { onConflict: 'event_id,entry_id' })

    if (error) {
      console.error(error)
    } else {
      // Refresh existing results
      const { data } = await supabase
        .from('imsa_entry_results')
        .select('*')
        .eq('event_id', eventId)
        .in('entry_id', classData.entries.map(e => e.id))
      if (data) {
        setExistingResults(data)
      }
      onSave()
    }
    setSaving(false)
  }

  if (loading) {
    return <LoadingSpinner size="sm" message="Loading results..." center />
  }

  // Sort entries by finish position (if exists) then by car number
  const sortedEntries = [...classData.entries].sort((a, b) => {
    const posA = results[a.id]?.finish_position ?? 999
    const posB = results[b.id]?.finish_position ?? 999
    if (posA !== posB) return posA - posB
    return parseInt(a.car_number) - parseInt(b.car_number)
  })

  const savedCount = existingResults.length
  const totalEntries = classData.entries.length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {savedCount} of {totalEntries} results saved
        </p>
        {savedCount === totalEntries && (
          <span className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
            <Check className="h-4 w-4" /> All results entered
          </span>
        )}
      </div>

      <div className="space-y-2">
        {sortedEntries.map(entry => {
          const hasResult = existingResults.some(r => r.entry_id === entry.id)
          return (
            <div
              key={entry.id}
              className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 rounded-lg border ${
                hasResult
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-background border-border'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className={`font-mono font-bold w-12 shrink-0 ${
                  hasResult ? 'text-green-900 dark:text-green-100' : ''
                }`}>#{entry.car_number}</span>
                <span className={`text-sm truncate ${
                  hasResult ? 'text-green-800 dark:text-green-100' : ''
                }`}>{entry.team_name}</span>
                <span className={`text-xs hidden sm:inline ${
                  hasResult ? 'text-green-700 dark:text-green-300' : 'text-muted-foreground'
                }`}>
                  ({entry.manufacturer.name})
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <input
                  type="number"
                  min="1"
                  placeholder="Pos"
                  className="w-16 p-2 border rounded bg-background text-foreground text-center"
                  value={results[entry.id]?.finish_position ?? ''}
                  onChange={(e) => setResults(prev => ({
                    ...prev,
                    [entry.id]: {
                      ...prev[entry.id],
                      finish_position: e.target.value ? parseInt(e.target.value) : null,
                      status: prev[entry.id]?.status || 'finished',
                      laps_completed: prev[entry.id]?.laps_completed ?? null
                    }
                  }))}
                />

                <select
                  className="p-2 border rounded bg-background text-foreground"
                  value={results[entry.id]?.status || 'finished'}
                  onChange={(e) => setResults(prev => ({
                    ...prev,
                    [entry.id]: {
                      ...prev[entry.id],
                      finish_position: prev[entry.id]?.finish_position ?? null,
                      status: e.target.value as ImsaEntryStatus,
                      laps_completed: prev[entry.id]?.laps_completed ?? null
                    }
                  }))}
                >
                  <option value="finished">Finished</option>
                  <option value="DNF">DNF</option>
                  <option value="DNS">DNS</option>
                  <option value="DQ">DQ</option>
                </select>

                {hasResult && (
                  <span className="text-green-600 dark:text-green-400 shrink-0">
                    <Check className="h-5 w-5" />
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : `Save ${classData.name} Results`}
      </Button>
    </div>
  )
}

// Prediction Statistics Component
interface PredictionStatsProps {
  eventId: string
  classes: ImsaClassWithEntries[]
}

interface PodiumPredictionWithDetails {
  id: string
  user_id: string
  event_id: string
  class_id: string
  position: number
  entry_id: string
  entry: { id: string; car_number: string; team_name: string } | null
}

interface ManufacturerPredictionWithDetails {
  id: string
  user_id: string
  event_id: string
  class_id: string
  manufacturer_id: string
  predicted_rank: number
  manufacturer: { id: string; name: string } | null
}

function PredictionStats({ eventId, classes }: PredictionStatsProps) {
  const [podiumPredictions, setPodiumPredictions] = useState<PodiumPredictionWithDetails[]>([])
  const [manufacturerPredictions, setManufacturerPredictions] = useState<ManufacturerPredictionWithDetails[]>([])
  const [users, setUsers] = useState<Map<string, string>>(new Map())
  const [loading, setLoading] = useState(true)
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)

      // Fetch podium predictions with entry info
      const { data: podiumData } = await supabase
        .from('imsa_podium_predictions')
        .select(`
          id,
          user_id,
          event_id,
          class_id,
          position,
          entry_id,
          entry:imsa_entries(id, car_number, team_name)
        `)
        .eq('event_id', eventId)

      // Fetch manufacturer predictions with manufacturer info
      const { data: mfrData } = await supabase
        .from('imsa_manufacturer_predictions')
        .select(`
          id,
          user_id,
          event_id,
          class_id,
          manufacturer_id,
          predicted_rank,
          manufacturer:imsa_manufacturers(id, name)
        `)
        .eq('event_id', eventId)

      // Transform the data - Supabase returns joined tables as objects, not arrays
      const transformedPodium: PodiumPredictionWithDetails[] = (podiumData || []).map((p: Record<string, unknown>) => ({
        id: p.id as string,
        user_id: p.user_id as string,
        event_id: p.event_id as string,
        class_id: p.class_id as string,
        position: p.position as number,
        entry_id: p.entry_id as string,
        entry: p.entry as { id: string; car_number: string; team_name: string } | null
      }))

      const transformedMfr: ManufacturerPredictionWithDetails[] = (mfrData || []).map((p: Record<string, unknown>) => ({
        id: p.id as string,
        user_id: p.user_id as string,
        event_id: p.event_id as string,
        class_id: p.class_id as string,
        manufacturer_id: p.manufacturer_id as string,
        predicted_rank: p.predicted_rank as number,
        manufacturer: p.manufacturer as { id: string; name: string } | null
      }))

      setPodiumPredictions(transformedPodium)
      setManufacturerPredictions(transformedMfr)

      // Fetch user profiles for display names
      const allUserIds = new Set([
        ...(podiumData || []).map((p: { user_id: string }) => p.user_id),
        ...(mfrData || []).map((p: { user_id: string }) => p.user_id)
      ])

      if (allUserIds.size > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles_public')
          .select('user_id, display_name')
          .in('user_id', Array.from(allUserIds))

        const userMap = new Map<string, string>()
        profiles?.forEach(p => {
          userMap.set(p.user_id, p.display_name || 'Unknown')
        })
        // Add any users without profiles
        allUserIds.forEach(userId => {
          if (!userMap.has(userId)) {
            userMap.set(userId, 'Unknown User')
          }
        })
        setUsers(userMap)
      }

      if (classes.length > 0 && !selectedClassId) {
        setSelectedClassId(classes[0].id)
      }

      setLoading(false)
    }

    fetchStats()
  }, [eventId, classes, selectedClassId])

  if (loading) {
    return <LoadingSpinner size="md" message="Loading prediction stats..." center />
  }

  const uniqueUserIds = new Set([
    ...podiumPredictions.map(p => p.user_id),
    ...manufacturerPredictions.map(p => p.user_id)
  ])

  // Calculate expected predictions per user
  const totalPodiumPicks = classes.length * 3 // 4 classes x 3 positions
  const totalMfrPicks = classes
    .filter(c => c.has_manufacturer_prediction)
    .reduce((sum, c) => sum + c.manufacturers.length, 0)

  // Get predictions for selected class
  const classPodiumPredictions = podiumPredictions.filter(p => p.class_id === selectedClassId)
  const classMfrPredictions = manufacturerPredictions.filter(p => p.class_id === selectedClassId)
  const selectedClass = classes.find(c => c.id === selectedClassId)

  // Calculate podium pick distribution
  const podiumDistribution: Record<number, Record<string, number>> = { 1: {}, 2: {}, 3: {} }
  classPodiumPredictions.forEach(p => {
    const carNum = p.entry?.car_number || 'Unknown'
    if (!podiumDistribution[p.position][carNum]) {
      podiumDistribution[p.position][carNum] = 0
    }
    podiumDistribution[p.position][carNum]++
  })

  // Calculate manufacturer rank distribution
  const mfrRankDistribution: Record<string, number[]> = {}
  classMfrPredictions.forEach(p => {
    const mfrName = p.manufacturer?.name || 'Unknown'
    if (!mfrRankDistribution[mfrName]) {
      mfrRankDistribution[mfrName] = []
    }
    mfrRankDistribution[mfrName].push(p.predicted_rank)
  })

  // Calculate average rank per manufacturer
  const mfrAverageRanks: { name: string; avg: number; count: number }[] = []
  for (const [name, ranks] of Object.entries(mfrRankDistribution)) {
    const avg = ranks.reduce((a, b) => a + b, 0) / ranks.length
    mfrAverageRanks.push({ name, avg, count: ranks.length })
  }
  mfrAverageRanks.sort((a, b) => a.avg - b.avg)

  const positionLabels: Record<number, string> = { 1: 'P1 Picks', 2: 'P2 Picks', 3: 'P3 Picks' }
  const positionEmojis: Record<number, string> = { 1: '1st', 2: '2nd', 3: '3rd' }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-secondary rounded-lg">
                <p className="text-3xl font-bold text-primary">{uniqueUserIds.size}</p>
                <p className="text-sm text-muted-foreground">Total Participants</p>
              </div>
              <div className="text-center p-4 bg-secondary rounded-lg">
                <p className="text-3xl font-bold text-primary">{podiumPredictions.length}</p>
                <p className="text-sm text-muted-foreground">Podium Picks</p>
              </div>
              <div className="text-center p-4 bg-secondary rounded-lg">
                <p className="text-3xl font-bold text-primary">{manufacturerPredictions.length}</p>
                <p className="text-sm text-muted-foreground">Manufacturer Ranks</p>
              </div>
              <div className="text-center p-4 bg-secondary rounded-lg">
                <p className="text-3xl font-bold text-primary">
                  {totalPodiumPicks + totalMfrPicks}
                </p>
                <p className="text-sm text-muted-foreground">Expected per User</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Class Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Tabs value={selectedClassId || ''} onValueChange={setSelectedClassId}>
          <TabsList>
            {classes.map(cls => (
              <TabsTrigger key={cls.id} value={cls.id}>
                {cls.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Podium Popularity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Podium Pick Distribution - {selectedClass?.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map(position => {
                const sorted = Object.entries(podiumDistribution[position])
                  .sort(([, a], [, b]) => b - a)

                return (
                  <div key={position}>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        position === 1 ? 'bg-yellow-500 text-yellow-950' :
                        position === 2 ? 'bg-gray-400 text-gray-950' :
                        'bg-amber-600 text-amber-950'
                      }`}>
                        {positionEmojis[position]}
                      </span>
                      {positionLabels[position]}
                    </h4>
                    {sorted.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No picks yet</p>
                    ) : (
                      <div className="space-y-2">
                        {sorted.slice(0, 5).map(([carNum, count], idx) => {
                          const percentage = uniqueUserIds.size > 0
                            ? Math.round(count / uniqueUserIds.size * 100)
                            : 0
                          return (
                            <div key={carNum} className="flex items-center gap-2">
                              <span className={`font-mono text-sm ${idx === 0 ? 'font-bold' : ''}`}>
                                #{carNum}
                              </span>
                              <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-full ${
                                    position === 1 ? 'bg-yellow-500' :
                                    position === 2 ? 'bg-gray-400' :
                                    'bg-amber-600'
                                  }`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground w-16 text-right">
                                {count} ({percentage}%)
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Manufacturer Rankings (if applicable) */}
      {selectedClass?.has_manufacturer_prediction && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Manufacturer Ranking Consensus - {selectedClass?.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Average predicted rank (lower = predicted to perform better)
              </p>
              {mfrAverageRanks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No manufacturer predictions yet</p>
              ) : (
                <div className="space-y-3">
                  {mfrAverageRanks.map((mfr, idx) => (
                    <div key={mfr.name} className="flex items-center gap-4 p-2 rounded-lg bg-muted/50">
                      <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${
                        idx === 0 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="flex-1 font-medium">{mfr.name}</span>
                      <span className="text-muted-foreground">
                        avg: {mfr.avg.toFixed(2)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({mfr.count} vote{mfr.count !== 1 ? 's' : ''})
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* User Participation List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Participants ({users.size})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {users.size === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No predictions made yet
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {Array.from(users.entries()).map(([userId, displayName]) => {
                  const userPodiumCount = podiumPredictions.filter(p => p.user_id === userId).length
                  const userMfrCount = manufacturerPredictions.filter(p => p.user_id === userId).length
                  const isComplete = userPodiumCount === totalPodiumPicks && userMfrCount === totalMfrPicks

                  return (
                    <div
                      key={userId}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg gap-2 ${
                        isComplete
                          ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                          : 'bg-secondary'
                      }`}
                    >
                      <span className={`font-medium ${isComplete ? 'text-green-900 dark:text-green-100' : 'text-foreground'}`}>
                        {displayName}
                      </span>
                      <div className="flex items-center gap-2 text-sm">
                        <span className={isComplete ? 'text-green-700 dark:text-green-300' : 'text-muted-foreground'}>
                          {userPodiumCount}/{totalPodiumPicks} podium
                        </span>
                        <span className={isComplete ? 'text-green-700 dark:text-green-300' : 'text-muted-foreground'}>|</span>
                        <span className={isComplete ? 'text-green-700 dark:text-green-300' : 'text-muted-foreground'}>
                          {userMfrCount}/{totalMfrPicks} mfr
                        </span>
                        {isComplete && (
                          <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                            <Check className="h-4 w-4" />
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export function AdminImsaEvents() {
  const { addToast } = useToast()
  const { events, loading: eventsLoading, refetch: refetchEvents } = useImsaEvents()

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('events')
  const [saving, setSaving] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [resultsClassTab, setResultsClassTab] = useState<string | null>(null)
  const [allResultsEntered, setAllResultsEntered] = useState(false)

  const { classes, refetch: refetchEventData } = useImsaEventData(selectedEventId)

  // Check if all results are entered for the selected event
  useEffect(() => {
    const checkAllResults = async () => {
      if (!selectedEventId || classes.length === 0) {
        setAllResultsEntered(false)
        return
      }

      const allEntryIds = classes.flatMap(c => c.entries.map(e => e.id))
      if (allEntryIds.length === 0) {
        setAllResultsEntered(false)
        return
      }

      const { data, error } = await supabase
        .from('imsa_entry_results')
        .select('entry_id')
        .eq('event_id', selectedEventId)
        .in('entry_id', allEntryIds)

      if (!error && data) {
        setAllResultsEntered(data.length === allEntryIds.length)
      }
    }
    checkAllResults()
  }, [selectedEventId, classes])

  // Set default results class tab when classes load
  useEffect(() => {
    if (classes.length > 0 && !resultsClassTab) {
      setResultsClassTab(classes[0].id)
    }
  }, [classes, resultsClassTab])

  // Handle Calculate Scores
  const handleCalculateScores = async () => {
    if (!selectedEventId) return

    setCalculating(true)

    const result = await calculateImsaScores(selectedEventId)

    if (result.success) {
      showSuccessToast(addToast, `Scores calculated for ${result.usersScored} users!`)
    } else {
      showErrorToast(addToast, result.error || 'Failed to calculate scores')
    }

    setCalculating(false)
  }

  // Handle results save callback
  const handleResultsSaved = async () => {
    showSuccessToast(addToast, 'Results saved!')
    // Re-check if all results are entered
    if (!selectedEventId || classes.length === 0) return

    const allEntryIds = classes.flatMap(c => c.entries.map(e => e.id))
    const { data } = await supabase
      .from('imsa_entry_results')
      .select('entry_id')
      .eq('event_id', selectedEventId)
      .in('entry_id', allEntryIds)

    if (data) {
      setAllResultsEntered(data.length === allEntryIds.length)
    }
  }

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

  const selectedEvent = events.find(e => e.id === selectedEventId)

  return (
    <AdminGuard>
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2">
                <Settings className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold text-foreground">IMSA Admin</h1>
                  <p className="text-sm text-muted-foreground">
                    Manage events, entries, and results
                  </p>
                </div>
              </div>

              {/* Event Selector */}
              {events.length > 0 && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <Select
                    value={selectedEventId || ''}
                    onValueChange={(value) => setSelectedEventId(value)}
                  >
                    <SelectTrigger className="w-[280px]">
                      <SelectValue placeholder="Select an event to manage" />
                    </SelectTrigger>
                    <SelectContent>
                      {events.map(event => (
                        <SelectItem key={event.id} value={event.id}>
                          <span className="flex items-center gap-2">
                            {event.name} ({event.year})
                            {event.is_active && (
                              <span className="text-xs text-green-600 dark:text-green-400">Active</span>
                            )}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Selected Event Info Bar */}
            {selectedEvent && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-secondary rounded-lg flex flex-wrap items-center justify-between gap-2"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-semibold text-foreground">{selectedEvent.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedEvent.track}</p>
                  </div>
                  {selectedEvent.is_active && (
                    <span className="inline-flex items-center gap-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                      <Check className="h-3 w-3" /> Active
                    </span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleActive(selectedEvent.id, selectedEvent.is_active)}
                >
                  {selectedEvent.is_active ? 'Deactivate' : 'Activate'}
                </Button>
              </motion.div>
            )}
          </motion.div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="entries" disabled={!selectedEventId}>Entries</TabsTrigger>
              <TabsTrigger value="predictions" disabled={!selectedEventId}>Predictions</TabsTrigger>
              <TabsTrigger value="results" disabled={!selectedEventId}>Results</TabsTrigger>
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
                            className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                              selectedEventId === event.id
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:bg-muted/30'
                            }`}
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
                            <div className="flex items-center gap-2">
                              {selectedEventId !== event.id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedEventId(event.id)}
                                >
                                  Select
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleActive(event.id, event.is_active)}
                              >
                                {event.is_active ? 'Deactivate' : 'Activate'}
                              </Button>
                            </div>
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
                    Select an event from the dropdown above
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

            {/* Predictions Tab */}
            <TabsContent value="predictions" className="space-y-6">
              {!selectedEventId ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-foreground mb-2">Select an Event</h2>
                    <p className="text-muted-foreground">
                      Select an event from the dropdown above to view prediction statistics.
                    </p>
                  </CardContent>
                </Card>
              ) : classes.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-foreground mb-2">No Classes</h2>
                    <p className="text-muted-foreground">
                      Create classes and entries in the Entries tab first.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <PredictionStats eventId={selectedEventId} classes={classes} />
              )}
            </TabsContent>

            {/* Results Tab */}
            <TabsContent value="results" className="space-y-6">
              {!selectedEventId ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-foreground mb-2">Select an Event</h2>
                    <p className="text-muted-foreground">
                      Select an event from the dropdown above to enter results.
                    </p>
                  </CardContent>
                </Card>
              ) : classes.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-foreground mb-2">No Classes</h2>
                    <p className="text-muted-foreground">
                      Create classes and entries in the Entries tab first.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Selected Event Info */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-card-foreground">
                              {events.find(e => e.id === selectedEventId)?.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Enter finish positions for each class below
                            </p>
                          </div>
                          {allResultsEntered && (
                            <span className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">
                              <Check className="h-4 w-4" /> All results entered
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Class Tabs for Results Entry */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle>Enter Results by Class</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Tabs value={resultsClassTab || classes[0]?.id} onValueChange={setResultsClassTab}>
                          <TabsList className="mb-4">
                            {classes.map(cls => (
                              <TabsTrigger key={cls.id} value={cls.id}>
                                {cls.name}
                              </TabsTrigger>
                            ))}
                          </TabsList>

                          {classes.map(cls => (
                            <TabsContent key={cls.id} value={cls.id}>
                              <ResultsEntryForm
                                classData={cls}
                                eventId={selectedEventId}
                                onSave={handleResultsSaved}
                              />
                            </TabsContent>
                          ))}
                        </Tabs>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Calculate Scores Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Calculator className="h-5 w-5" />
                          Calculate User Scores
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          After entering all results, calculate scores for all users who made predictions.
                          This will update the leaderboards.
                        </p>
                        {!allResultsEntered && (
                          <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                              Not all results have been entered yet. You can still calculate scores,
                              but results may be incomplete.
                            </p>
                          </div>
                        )}
                        <Button
                          onClick={handleCalculateScores}
                          disabled={calculating}
                          size="lg"
                        >
                          {calculating ? (
                            <>
                              <LoadingSpinner size="sm" />
                              <span className="ml-2">Calculating...</span>
                            </>
                          ) : (
                            'Calculate All User Scores'
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminGuard>
  )
}
