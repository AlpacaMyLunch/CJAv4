import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, AlertCircle, X, Check, Target } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useImsaEvents } from '@/hooks/useImsaEvents'
import { useImsaLeaderboards } from '@/hooks/useImsaLeaderboards'
import { LeaderboardTable } from '@/components/imsa'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { supabase } from '@/lib/supabase'

interface UserScoreDetail {
  userId: string
  displayName: string
  eventId: string
  eventName: string
  podiumPredictions: {
    classId: string
    className: string
    position: number
    carNumber: string
    teamName: string
    actualFinish: number | null
    points: number
  }[]
  manufacturerPredictions: {
    classId: string
    className: string
    manufacturerName: string
    predictedRank: number
    actualRank: number | null
    points: number
  }[]
  totalPodiumPoints: number
  totalMfrPoints: number
}

// User Detail Modal Component
interface UserDetailModalProps {
  userId: string
  displayName: string
  eventId: string
  eventName: string
  onClose: () => void
}

function UserDetailModal({ userId, displayName, eventId, eventName, onClose }: UserDetailModalProps) {
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<UserScoreDetail | null>(null)

  useEffect(() => {
    async function fetchDetails() {
      setLoading(true)
      try {
        // Fetch podium predictions with results
        const { data: podiumData } = await supabase
          .from('imsa_podium_predictions')
          .select(`
            position,
            entry:imsa_entries(
              id,
              car_number,
              team_name,
              class:imsa_classes(id, name)
            )
          `)
          .eq('user_id', userId)
          .eq('event_id', eventId)

        // Fetch entry results
        const { data: resultsData } = await supabase
          .from('imsa_entry_results')
          .select('entry_id, finish_position, status')
          .eq('event_id', eventId)

        const resultMap = new Map(resultsData?.map(r => [r.entry_id, r]) || [])

        // Fetch manufacturer predictions
        const { data: mfrPredData } = await supabase
          .from('imsa_manufacturer_predictions')
          .select(`
            predicted_rank,
            class:imsa_classes(id, name),
            manufacturer:imsa_manufacturers(id, name)
          `)
          .eq('user_id', userId)
          .eq('event_id', eventId)

        // Fetch manufacturer results
        const { data: mfrResultsData } = await supabase
          .from('imsa_manufacturer_results')
          .select('class_id, manufacturer_id, final_rank')
          .eq('event_id', eventId)

        const mfrResultMap = new Map(
          mfrResultsData?.map(r => [`${r.class_id}-${r.manufacturer_id}`, r.final_rank]) || []
        )

        // Fetch scoring rules
        const { data: scoringRules } = await supabase
          .from('imsa_scoring_rules')
          .select('*')

        // Calculate points for each prediction
        const podiumPredictions = (podiumData || []).map((p: Record<string, unknown>) => {
          const entry = p.entry as Record<string, unknown> | null
          const cls = entry?.class as Record<string, unknown> | null
          const entryId = entry?.id as string
          const result = resultMap.get(entryId)
          const actualFinish = result?.finish_position || null

          let points = 0
          if (actualFinish !== null) {
            const predictedPos = p.position as number
            if (actualFinish === predictedPos) {
              const rule = scoringRules?.find((r: Record<string, unknown>) =>
                r.category === 'podium' && r.prediction_position === predictedPos && r.result_type === 'exact'
              )
              points = (rule?.points as number) || 0
            } else if (actualFinish >= 1 && actualFinish <= 3) {
              const rule = scoringRules?.find((r: Record<string, unknown>) =>
                r.category === 'podium' && r.prediction_position === predictedPos && r.result_type === 'on_podium'
              )
              points = (rule?.points as number) || 0
            } else if (actualFinish >= 4 && actualFinish <= 5) {
              const rule = scoringRules?.find((r: Record<string, unknown>) =>
                r.category === 'podium' && r.prediction_position === predictedPos && r.result_type === 'top_5'
              )
              points = (rule?.points as number) || 0
            }
          }

          return {
            classId: cls?.id as string || '',
            className: cls?.name as string || '',
            position: p.position as number,
            carNumber: entry?.car_number as string || '',
            teamName: entry?.team_name as string || '',
            actualFinish,
            points
          }
        })

        const manufacturerPredictions = (mfrPredData || []).map((m: Record<string, unknown>) => {
          const cls = m.class as Record<string, unknown> | null
          const mfr = m.manufacturer as Record<string, unknown> | null
          const key = `${cls?.id}-${mfr?.id}`
          const actualRank = mfrResultMap.get(key) || null

          let points = 0
          if (actualRank !== null) {
            const diff = Math.abs((m.predicted_rank as number) - actualRank)
            if (diff === 0) {
              points = scoringRules?.find((r: Record<string, unknown>) =>
                r.category === 'manufacturer' && r.result_type === 'exact'
              )?.points as number || 0
            } else if (diff === 1) {
              points = scoringRules?.find((r: Record<string, unknown>) =>
                r.category === 'manufacturer' && r.result_type === 'off_1'
              )?.points as number || 0
            } else if (diff === 2) {
              points = scoringRules?.find((r: Record<string, unknown>) =>
                r.category === 'manufacturer' && r.result_type === 'off_2'
              )?.points as number || 0
            }
          }

          return {
            classId: cls?.id as string || '',
            className: cls?.name as string || '',
            manufacturerName: mfr?.name as string || '',
            predictedRank: m.predicted_rank as number,
            actualRank,
            points
          }
        })

        setDetail({
          userId,
          displayName,
          eventId,
          eventName,
          podiumPredictions,
          manufacturerPredictions,
          totalPodiumPoints: podiumPredictions.reduce((sum, p) => sum + p.points, 0),
          totalMfrPoints: manufacturerPredictions.reduce((sum, p) => sum + p.points, 0)
        })
      } catch (err) {
        console.error('Failed to fetch user details:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDetails()
  }, [userId, eventId, displayName, eventName])

  // Group predictions by class
  const podiumByClass = detail?.podiumPredictions.reduce((acc, p) => {
    if (!acc[p.className]) acc[p.className] = []
    acc[p.className].push(p)
    return acc
  }, {} as Record<string, typeof detail.podiumPredictions>) || {}

  const mfrByClass = detail?.manufacturerPredictions.reduce((acc, p) => {
    if (!acc[p.className]) acc[p.className] = []
    acc[p.className].push(p)
    return acc
  }, {} as Record<string, typeof detail.manufacturerPredictions>) || {}

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-2xl max-h-[80vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-xl">{displayName}</CardTitle>
            <p className="text-sm text-muted-foreground">{eventName}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent className="overflow-y-auto max-h-[calc(80vh-100px)]">
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="md" message="Loading details..." center />
            </div>
          ) : detail ? (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-primary">{detail.totalPodiumPoints}</p>
                  <p className="text-xs text-muted-foreground">Podium Points</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-primary">{detail.totalMfrPoints}</p>
                  <p className="text-xs text-muted-foreground">Mfr Points</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-primary">{detail.totalPodiumPoints + detail.totalMfrPoints}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>

              {/* Podium Predictions */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Podium Predictions
                </h4>
                {Object.entries(podiumByClass).map(([className, predictions]) => (
                  <div key={className} className="mb-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">{className}</p>
                    <div className="space-y-2">
                      {predictions.sort((a, b) => a.position - b.position).map((p, i) => (
                        <div
                          key={i}
                          className={`flex items-center justify-between p-2 rounded-lg text-sm ${
                            p.points > 0
                              ? 'bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-100'
                              : 'bg-muted'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-8 text-center font-mono">P{p.position}</span>
                            <span className="font-medium">#{p.carNumber}</span>
                            <span className="text-muted-foreground truncate max-w-[150px]">{p.teamName}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={p.actualFinish ? '' : 'text-muted-foreground'}>
                              {p.actualFinish ? `Finished P${p.actualFinish}` : 'Pending'}
                            </span>
                            {p.points > 0 && (
                              <span className="flex items-center gap-1 font-semibold text-green-600 dark:text-green-400">
                                <Check className="h-4 w-4" />
                                +{p.points}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {Object.keys(podiumByClass).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No podium predictions</p>
                )}
              </div>

              {/* Manufacturer Predictions */}
              {Object.keys(mfrByClass).length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    Manufacturer Rankings
                  </h4>
                  {Object.entries(mfrByClass).map(([className, predictions]) => (
                    <div key={className} className="mb-4">
                      <p className="text-sm font-medium text-muted-foreground mb-2">{className}</p>
                      <div className="space-y-2">
                        {predictions.sort((a, b) => a.predictedRank - b.predictedRank).map((p, i) => (
                          <div
                            key={i}
                            className={`flex items-center justify-between p-2 rounded-lg text-sm ${
                              p.points > 0
                                ? 'bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-100'
                                : 'bg-muted'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-8 text-center font-mono">#{p.predictedRank}</span>
                              <span className="font-medium">{p.manufacturerName}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={p.actualRank ? '' : 'text-muted-foreground'}>
                                {p.actualRank ? `Actual #${p.actualRank}` : 'Pending'}
                              </span>
                              {p.points > 0 && (
                                <span className="flex items-center gap-1 font-semibold text-green-600 dark:text-green-400">
                                  <Check className="h-4 w-4" />
                                  +{p.points}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function ImsaLeaderboard() {
  const { user } = useAuth()
  const { events, loading: eventsLoading, error: eventsError } = useImsaEvents()
  const {
    eventLeaderboard,
    seasonLeaderboard,
    allTimeLeaderboard,
    loading,
    error,
    fetchEventLeaderboard,
    fetchSeasonLeaderboard,
    fetchAllTimeLeaderboard
  } = useImsaLeaderboards()

  const [activeTab, setActiveTab] = useState('event')
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedUser, setSelectedUser] = useState<{ userId: string; displayName: string } | null>(null)

  // Get unique years from events
  const years = [...new Set(events.map(e => e.year))].sort((a, b) => b - a)

  // Events filtered by selected year
  const eventsForYear = events.filter(e => e.year === selectedYear)

  // Auto-select first event when year changes or events load
  useEffect(() => {
    if (eventsForYear.length > 0 && !selectedEventId) {
      setSelectedEventId(eventsForYear[0].id)
    }
  }, [eventsForYear, selectedEventId])

  // Fetch data when selections change
  useEffect(() => {
    if (activeTab === 'event' && selectedEventId) {
      fetchEventLeaderboard(selectedEventId)
    }
  }, [activeTab, selectedEventId, fetchEventLeaderboard])

  useEffect(() => {
    if (activeTab === 'season' && selectedYear) {
      fetchSeasonLeaderboard(selectedYear)
    }
  }, [activeTab, selectedYear, fetchSeasonLeaderboard])

  useEffect(() => {
    if (activeTab === 'all-time') {
      fetchAllTimeLeaderboard()
    }
  }, [activeTab, fetchAllTimeLeaderboard])

  // Reset event selection when year changes
  useEffect(() => {
    setSelectedEventId(null)
  }, [selectedYear])

  if (eventsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading leaderboards..." center />
      </div>
    )
  }

  if (eventsError || error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Error Loading Data</h1>
          <p className="text-muted-foreground">{eventsError || error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Trophy className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">IMSA Leaderboards</h1>
          </div>
          <p className="text-muted-foreground">
            Click any row to see prediction details
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="pt-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="event">Event</TabsTrigger>
                  <TabsTrigger value="season">Season</TabsTrigger>
                  <TabsTrigger value="all-time">All-Time</TabsTrigger>
                </TabsList>

                {/* Event Leaderboard */}
                <TabsContent value="event" className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {years.length > 0 && (
                      <Select
                        value={selectedYear.toString()}
                        onValueChange={(val) => setSelectedYear(parseInt(val))}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map(year => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {eventsForYear.length > 0 && (
                      <Select
                        value={selectedEventId || ''}
                        onValueChange={setSelectedEventId}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select event" />
                        </SelectTrigger>
                        <SelectContent>
                          {eventsForYear.map(event => (
                            <SelectItem key={event.id} value={event.id}>
                              {event.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {loading ? (
                    <div className="flex justify-center py-12">
                      <LoadingSpinner size="md" message="Loading leaderboard..." center />
                    </div>
                  ) : eventsForYear.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      No events found for {selectedYear}
                    </div>
                  ) : (
                    <LeaderboardTable
                      data={eventLeaderboard}
                      type="event"
                      currentUserId={user?.id}
                      onUserClick={(userId, displayName) => setSelectedUser({ userId, displayName })}
                    />
                  )}
                </TabsContent>

                {/* Season Leaderboard */}
                <TabsContent value="season" className="space-y-4">
                  {years.length > 0 && (
                    <Select
                      value={selectedYear.toString()}
                      onValueChange={(val) => setSelectedYear(parseInt(val))}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map(year => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {loading ? (
                    <div className="flex justify-center py-12">
                      <LoadingSpinner size="md" message="Loading leaderboard..." center />
                    </div>
                  ) : (
                    <LeaderboardTable
                      data={seasonLeaderboard}
                      type="season"
                      title={`${selectedYear} Season Standings`}
                      currentUserId={user?.id}
                    />
                  )}
                </TabsContent>

                {/* All-Time Leaderboard */}
                <TabsContent value="all-time">
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <LoadingSpinner size="md" message="Loading leaderboard..." center />
                    </div>
                  ) : (
                    <LeaderboardTable
                      data={allTimeLeaderboard}
                      type="all-time"
                      currentUserId={user?.id}
                    />
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Cards */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <Card className="hover:shadow-lg hover:shadow-primary/5 transition-all duration-200">
              <CardContent className="pt-6 text-center">
                <p className="text-2xl font-bold text-primary">
                  {eventLeaderboard.find(r => r.user_id === user.id)?.total_points || 0}
                </p>
                <p className="text-sm text-muted-foreground">Your Event Points</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg hover:shadow-primary/5 transition-all duration-200">
              <CardContent className="pt-6 text-center">
                <p className="text-2xl font-bold text-primary">
                  {seasonLeaderboard.find(r => r.user_id === user.id)?.total_points || 0}
                </p>
                <p className="text-sm text-muted-foreground">Your Season Points</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg hover:shadow-primary/5 transition-all duration-200">
              <CardContent className="pt-6 text-center">
                <p className="text-2xl font-bold text-primary">
                  #{allTimeLeaderboard.find(r => r.user_id === user.id)?.rank || '-'}
                </p>
                <p className="text-sm text-muted-foreground">All-Time Rank</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUser && selectedEventId && (
        <UserDetailModal
          userId={selectedUser.userId}
          displayName={selectedUser.displayName}
          eventId={selectedEventId}
          eventName={eventsForYear.find(e => e.id === selectedEventId)?.name || 'Event'}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  )
}
