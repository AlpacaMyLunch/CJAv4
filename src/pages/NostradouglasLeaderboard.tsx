import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSeasonData } from '@/hooks/useSeasonData'
import { supabase, type NostradouglasLeaderboard, type ScheduleWithTrack } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, Trophy, Users, TrendingUp } from 'lucide-react'

export function NostradouglasLeaderboard() {
  const { seasonId } = useParams<{ seasonId?: string }>()
  const navigate = useNavigate()
  const { season: currentSeason, loading: seasonLoading } = useSeasonData()
  const [leaderboard, setLeaderboard] = useState<NostradouglasLeaderboard[]>([])
  const [schedule, setSchedule] = useState<ScheduleWithTrack[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Use provided seasonId or fall back to current season
  const effectiveSeasonId = seasonId || currentSeason?.id

  useEffect(() => {
    if (!effectiveSeasonId) return

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch leaderboard
        const { data: leaderboardData, error: leaderboardError } = await supabase
          .from('nostradouglas_leaderboard')
          .select('*')
          .eq('season_id', effectiveSeasonId)
          .order('rank')

        if (leaderboardError) throw leaderboardError

        // Fetch schedule with track names
        const { data: scheduleData, error: scheduleError } = await supabase
          .from('schedule')
          .select(`
            id,
            season_id,
            week,
            track_id,
            race_date,
            created_at,
            tracks:track_id (
              name
            )
          `)
          .eq('season_id', effectiveSeasonId)
          .order('week')

        if (scheduleError) throw scheduleError

        // Transform schedule data to include track_name
        const transformedSchedule = scheduleData?.map(item => ({
          id: item.id,
          season_id: item.season_id,
          week: item.week,
          track_id: item.track_id,
          track_name: (item.tracks as any)?.name || 'Unknown Track',
          race_date: item.race_date,
          created_at: item.created_at
        })) || []

        setLeaderboard(leaderboardData || [])
        setSchedule(transformedSchedule)
      } catch (err) {
        console.error('Error fetching leaderboard:', err)
        setError(err instanceof Error ? err.message : 'Failed to load leaderboard')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [effectiveSeasonId])

  if (seasonLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading leaderboard...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-destructive mb-4">Error Loading Leaderboard</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  const seasonInfo = leaderboard[0]
  const totalParticipants = leaderboard.length
  const highestScore = leaderboard[0]?.total_points || 0
  const averageScore = leaderboard.length > 0
    ? Math.round((leaderboard.reduce((sum, p) => sum + p.total_points, 0) / leaderboard.length) * 10) / 10
    : 0

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Nostradouglas Leaderboard - Season {seasonInfo?.season_number || currentSeason?.season_number}
        </h1>
        <p className="text-muted-foreground">
          {seasonInfo?.season_name || 'Track prediction competition results'}
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Participants</p>
                <p className="text-2xl font-bold">{totalParticipants}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-yellow-500/10 rounded-full">
                <Trophy className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Highest Score</p>
                <p className="text-2xl font-bold">{highestScore} / 16</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-500/10 rounded-full">
                <TrendingUp className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average Score</p>
                <p className="text-2xl font-bold">{averageScore}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Leaderboard Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Rankings</CardTitle>
              <CardDescription>Click a participant to view their detailed predictions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Rank</th>
                      <th className="text-left py-3 px-4 font-medium">Participant</th>
                      <th className="text-center py-3 px-4 font-medium">Total</th>
                      <th className="text-center py-3 px-4 font-medium">Tracks</th>
                      <th className="text-center py-3 px-4 font-medium">Weeks</th>
                      <th className="text-center py-3 px-4 font-medium">Predictions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((participant, index) => {
                      const isFirstPlace = participant.rank === 1
                      const isTie = index > 0 && participant.rank === leaderboard[index - 1].rank

                      return (
                        <tr
                          key={participant.user_id}
                          onClick={() => navigate(`/nostradouglas/${effectiveSeasonId}/user/${participant.user_id}`)}
                          className={`border-b hover:bg-muted/50 cursor-pointer transition-colors ${
                            isFirstPlace ? 'bg-yellow-500/5' : ''
                          } ${isTie ? 'bg-blue-500/5' : ''}`}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {isFirstPlace && <Trophy className="h-4 w-4 text-yellow-500" />}
                              <span className="font-medium">{participant.rank}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-medium">{participant.display_name}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="font-bold text-primary">{participant.total_points}</span>
                          </td>
                          <td className="py-3 px-4 text-center text-muted-foreground">{participant.track_points}</td>
                          <td className="py-3 px-4 text-center text-muted-foreground">{participant.week_points}</td>
                          <td className="py-3 px-4 text-center text-muted-foreground">{participant.predictions_made}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Answer Key */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Answer Key</CardTitle>
              <CardDescription>Actual season schedule</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {schedule.map((scheduleItem) => (
                  <div key={scheduleItem.id} className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                        {scheduleItem.week}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{scheduleItem.track_name}</p>
                        {scheduleItem.race_date && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(scheduleItem.race_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
