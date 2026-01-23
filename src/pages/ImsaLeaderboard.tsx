import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useImsaEvents } from '@/hooks/useImsaEvents'
import { useImsaLeaderboards } from '@/hooks/useImsaLeaderboards'
import { LeaderboardTable } from '@/components/imsa'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

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
            IMSA Predictions Leaderboard
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
    </div>
  )
}
