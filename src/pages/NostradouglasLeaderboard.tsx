import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSeasonData } from '@/hooks/useSeasonData'
import { supabase, type NostradouglasLeaderboard as NostradouglasLeaderboardType, type ScheduleWithTrack } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator
} from '@/components/ui/select'
import { Trophy, Users, TrendingUp } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { formatShortDate } from '@/utils/date'
import type { Season } from '@/lib/types'

type SeasonOption = Pick<Season, 'id' | 'season_number' | 'name'>

const CUMULATIVE_VALUE = 'cumulative'

export function NostradouglasLeaderboard() {
  const { seasonNumber } = useParams<{ seasonNumber?: string }>()
  const navigate = useNavigate()
  const { loading: seasonLoading } = useSeasonData()
  const [leaderboard, setLeaderboard] = useState<NostradouglasLeaderboardType[]>([])
  const [schedule, setSchedule] = useState<ScheduleWithTrack[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [seasonId, setSeasonId] = useState<string | null>(null)
  const [availableSeasons, setAvailableSeasons] = useState<SeasonOption[]>([])
  const [selectedSeasonValue, setSelectedSeasonValue] = useState<string | null>(null)
  const [isCumulative, setIsCumulative] = useState(false)

  // Fetch all seasons that have leaderboard data
  useEffect(() => {
    const fetchAvailableSeasons = async () => {
      // Get distinct seasons from the leaderboard view
      const { data, error } = await supabase
        .from('nostradouglas_leaderboard')
        .select('season_id, season_number, season_name')

      if (error) {
        console.error('Error fetching available seasons:', error)
        return
      }

      // Deduplicate and sort by season_number descending (most recent first)
      const seasonsMap = new Map<string, SeasonOption>()
      data?.forEach(row => {
        if (!seasonsMap.has(row.season_id)) {
          seasonsMap.set(row.season_id, {
            id: row.season_id,
            season_number: row.season_number,
            name: row.season_name
          })
        }
      })

      const seasons = Array.from(seasonsMap.values())
        .sort((a, b) => b.season_number - a.season_number)

      setAvailableSeasons(seasons)

      // If no seasonNumber param and we have available seasons, default to most recent
      if (!seasonNumber && seasons.length > 0) {
        setSelectedSeasonValue(seasons[0].id)
        setSeasonId(seasons[0].id)
        setIsCumulative(false)
      }
    }

    fetchAvailableSeasons()
  }, [seasonNumber])

  // Resolve season ID from URL param if provided
  useEffect(() => {
    const resolveSeason = async () => {
      if (seasonNumber) {
        // Fetch season by season number
        const { data, error } = await supabase
          .from('seasons')
          .select('id')
          .eq('season_number', parseInt(seasonNumber))
          .single()

        if (error || !data) {
          setError(`Season ${seasonNumber} not found`)
          setLoading(false)
          return
        }

        setSeasonId(data.id)
        setSelectedSeasonValue(data.id)
        setIsCumulative(false)
      }
    }

    if (seasonNumber) {
      resolveSeason()
    }
  }, [seasonNumber])

  useEffect(() => {
    if (!seasonId && !isCumulative) return

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        if (isCumulative) {
          // Fetch all leaderboard data across all seasons
          const { data: leaderboardData, error: leaderboardError } = await supabase
            .from('nostradouglas_leaderboard')
            .select('*')

          if (leaderboardError) throw leaderboardError

          // Aggregate scores by user across all seasons
          const userTotals = new Map<string, {
            user_id: string
            display_name: string
            total_points: number
            track_points: number
            week_points: number
            predictions_made: number
            seasons_participated: number
          }>()

          leaderboardData?.forEach(row => {
            const existing = userTotals.get(row.user_id)
            if (existing) {
              existing.total_points += row.total_points
              existing.track_points += row.track_points
              existing.week_points += row.week_points
              existing.predictions_made += row.predictions_made
              existing.seasons_participated += 1
            } else {
              userTotals.set(row.user_id, {
                user_id: row.user_id,
                display_name: row.display_name,
                total_points: row.total_points,
                track_points: row.track_points,
                week_points: row.week_points,
                predictions_made: row.predictions_made,
                seasons_participated: 1
              })
            }
          })

          // Convert to array and calculate ranks
          const aggregated = Array.from(userTotals.values())
            .sort((a, b) => b.total_points - a.total_points)
            .map((user, index, arr) => {
              // Handle ties - same points = same rank
              let rank = index + 1
              if (index > 0 && arr[index - 1].total_points === user.total_points) {
                // Find the first user with this score to get their rank
                for (let i = index - 1; i >= 0; i--) {
                  if (arr[i].total_points === user.total_points) {
                    rank = i + 1
                  } else {
                    break
                  }
                }
              }
              return {
                ...user,
                season_id: CUMULATIVE_VALUE,
                season_name: 'All Time',
                season_number: 0,
                rank
              } as NostradouglasLeaderboardType & { seasons_participated: number }
            })

          setLeaderboard(aggregated)
          setSchedule([]) // No schedule for cumulative view
        } else {
          // Fetch leaderboard for specific season
          const { data: leaderboardData, error: leaderboardError } = await supabase
            .from('nostradouglas_leaderboard')
            .select('*')
            .eq('season_id', seasonId)
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
            .eq('season_id', seasonId)
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
        }
      } catch (err) {
        console.error('Error fetching leaderboard:', err)
        setError(err instanceof Error ? err.message : 'Failed to load leaderboard')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [seasonId, isCumulative])

  // Handler for season dropdown change
  const handleSeasonChange = (value: string) => {
    setSelectedSeasonValue(value)
    if (value === CUMULATIVE_VALUE) {
      setIsCumulative(true)
      setSeasonId(null)
      // Update URL to remove season param
      navigate('/nostradouglas/leaderboard')
    } else {
      setIsCumulative(false)
      setSeasonId(value)
      // Find the season number for URL
      const season = availableSeasons.find(s => s.id === value)
      if (season) {
        navigate(`/nostradouglas/season/${season.season_number}`)
      }
    }
  }

  // Get display info for selected season
  const selectedSeasonInfo = useMemo(() => {
    if (isCumulative) {
      return { name: 'All Time', number: null }
    }
    const season = availableSeasons.find(s => s.id === selectedSeasonValue)
    return season ? { name: season.name, number: season.season_number } : null
  }, [isCumulative, selectedSeasonValue, availableSeasons])

  if (seasonLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner message="Loading leaderboard..." />
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

  const totalParticipants = leaderboard.length
  const highestScore = leaderboard[0]?.total_points || 0
  const averageScore = leaderboard.length > 0
    ? Math.round((leaderboard.reduce((sum, p) => sum + p.total_points, 0) / leaderboard.length) * 10) / 10
    : 0

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            Nostradouglas Leaderboard{isCumulative ? ' - All Time' : selectedSeasonInfo?.number ? ` - Season ${selectedSeasonInfo.number}` : ''}
          </h1>
          <p className="text-muted-foreground">
            {isCumulative ? 'Cumulative results across all seasons' : selectedSeasonInfo?.name || 'Track prediction competition results'}
          </p>
        </div>

        {/* Season Selector */}
        {availableSeasons.length > 0 && (
          <div className="w-full sm:w-56">
            <Select
              value={selectedSeasonValue || ''}
              onValueChange={handleSeasonChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select season..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={CUMULATIVE_VALUE}>
                  All Time (Cumulative)
                </SelectItem>
                <SelectSeparator />
                {availableSeasons.map((season) => (
                  <SelectItem key={season.id} value={season.id}>
                    Season {season.season_number}{season.name ? ` - ${season.name}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
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
                <p className="text-2xl font-bold">{highestScore}{!isCumulative && ' / 16'}</p>
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

      <div className={`grid gap-6 ${isCumulative ? '' : 'lg:grid-cols-3'}`}>
        {/* Leaderboard Table */}
        <div className={isCumulative ? '' : 'lg:col-span-2'}>
          <Card>
            <CardHeader>
              <CardTitle>Rankings</CardTitle>
              <CardDescription>
                {isCumulative
                  ? 'Cumulative scores across all Nostradouglas seasons'
                  : 'Click a participant to view their detailed predictions'}
              </CardDescription>
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
                      {isCumulative ? (
                        <th className="text-center py-3 px-4 font-medium">Seasons</th>
                      ) : (
                        <th className="text-center py-3 px-4 font-medium">Predictions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((participant, index) => {
                      const isFirstPlace = participant.rank === 1
                      const isTie = index > 0 && participant.rank === leaderboard[index - 1].rank
                      const participantWithSeasons = participant as NostradouglasLeaderboardType & { seasons_participated?: number }

                      return (
                        <tr
                          key={participant.user_id}
                          onClick={isCumulative ? undefined : () => navigate(`/nostradouglas/season/${participant.season_number}/user/${participant.user_id}`)}
                          className={`border-b transition-colors ${
                            isFirstPlace ? 'bg-yellow-500/5' : ''
                          } ${isTie ? 'bg-blue-500/5' : ''} ${!isCumulative ? 'hover:bg-muted/50 cursor-pointer' : ''}`}
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
                          {isCumulative ? (
                            <td className="py-3 px-4 text-center text-muted-foreground">
                              {participantWithSeasons.seasons_participated || 0}
                            </td>
                          ) : (
                            <td className="py-3 px-4 text-center text-muted-foreground">{participant.predictions_made}</td>
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Answer Key - Only show for single season view */}
        {!isCumulative && schedule.length > 0 && (
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
                              {formatShortDate(scheduleItem.race_date)}
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
        )}
      </div>
    </div>
  )
}
