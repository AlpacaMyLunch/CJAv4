import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase, type NostradouglasLeaderboard, type NostradouglasDetailedResults, type ScheduleWithTrack } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowLeft, Trophy, CheckCircle2, Circle, XCircle } from 'lucide-react'

export function NostradouglasUserResults() {
  const { seasonNumber, userId } = useParams<{ seasonNumber: string; userId?: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [userSummary, setUserSummary] = useState<NostradouglasLeaderboard | null>(null)
  const [detailedResults, setDetailedResults] = useState<NostradouglasDetailedResults[]>([])
  const [schedule, setSchedule] = useState<ScheduleWithTrack[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [seasonId, setSeasonId] = useState<string | null>(null)

  // Use provided userId or fall back to current user
  const effectiveUserId = userId || user?.id

  // Resolve season ID from season number
  useEffect(() => {
    if (!seasonNumber) return

    const resolveSeason = async () => {
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
    }

    resolveSeason()
  }, [seasonNumber])

  useEffect(() => {
    if (!seasonId || !effectiveUserId) return

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch user summary
        const { data: summaryData, error: summaryError } = await supabase
          .from('nostradouglas_leaderboard')
          .select('*')
          .eq('season_id', seasonId)
          .eq('user_id', effectiveUserId)
          .single()

        if (summaryError) throw summaryError

        // Fetch detailed results
        const { data: resultsData, error: resultsError } = await supabase
          .from('nostradouglas_detailed_results')
          .select('*')
          .eq('season_id', seasonId)
          .eq('user_id', effectiveUserId)
          .order('predicted_week')

        if (resultsError) throw resultsError

        // Fetch schedule
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

        // Transform schedule data
        const transformedSchedule = scheduleData?.map(item => ({
          id: item.id,
          season_id: item.season_id,
          week: item.week,
          track_id: item.track_id,
          track_name: (item.tracks as any)?.name || 'Unknown Track',
          race_date: item.race_date,
          created_at: item.created_at
        })) || []

        setUserSummary(summaryData)
        setDetailedResults(resultsData || [])
        setSchedule(transformedSchedule)
      } catch (err) {
        console.error('Error fetching user results:', err)
        setError(err instanceof Error ? err.message : 'Failed to load results')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [seasonId, effectiveUserId, seasonNumber])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading results...</span>
        </div>
      </div>
    )
  }

  if (error || !userSummary) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-destructive mb-4">Error Loading Results</h1>
          <p className="text-muted-foreground">{error || 'User results not found'}</p>
          <Button onClick={() => navigate(`/nostradouglas/season/${seasonNumber}`)} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Leaderboard
          </Button>
        </div>
      </div>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Perfect Match':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'Track Match Only':
        return <Circle className="h-5 w-5 text-yellow-500" />
      case 'No Match':
        return <XCircle className="h-5 w-5 text-muted-foreground" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Perfect Match':
        return 'bg-green-500/10 text-green-700 dark:text-green-400'
      case 'Track Match Only':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
      case 'No Match':
        return 'bg-muted text-muted-foreground'
      default:
        return ''
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(`/nostradouglas/season/${seasonNumber}`)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Leaderboard
        </Button>

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{userSummary.display_name}</h1>
            <p className="text-muted-foreground">
              Season {userSummary.season_number} Results
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="flex items-center gap-2 mb-1">
                {userSummary.rank === 1 && <Trophy className="h-5 w-5 text-yellow-500" />}
                <p className="text-2xl font-bold">#{userSummary.rank}</p>
              </div>
              <p className="text-xs text-muted-foreground">Rank</p>
            </div>

            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{userSummary.total_points}</p>
              <p className="text-xs text-muted-foreground">Total Points</p>
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="mt-4 flex gap-4 text-sm">
          <div className="px-3 py-1 bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-full">
            {userSummary.track_points}/8 tracks correct
          </div>
          <div className="px-3 py-1 bg-purple-500/10 text-purple-700 dark:text-purple-400 rounded-full">
            {userSummary.week_points}/8 weeks correct
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Predictions Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Your Predictions</CardTitle>
              <CardDescription>
                1 point for correct track, +1 point for correct week (2 points max per prediction)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Week</th>
                      <th className="text-left py-3 px-4 font-medium">Predicted Track</th>
                      <th className="text-center py-3 px-4 font-medium">Actual Week</th>
                      <th className="text-center py-3 px-4 font-medium">Points</th>
                      <th className="text-left py-3 px-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailedResults.map((result) => (
                      <tr
                        key={result.predicted_week}
                        className={`border-b ${getStatusColor(result.status)}`}
                      >
                        <td className="py-3 px-4">
                          <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-medium">
                            {result.predicted_week}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium">{result.predicted_track}</td>
                        <td className="py-3 px-4 text-center">
                          {result.actual_week !== null ? result.actual_week : '-'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-bold">{result.prediction_points}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(result.status)}
                            <span className="text-sm">
                              {result.status === 'No Match' && result.actual_week === null
                                ? 'Not in schedule'
                                : result.status}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Legend */}
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium mb-2">Legend:</p>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-muted-foreground">Perfect Match - Correct track and week (2 points)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Circle className="h-4 w-4 text-yellow-500" />
                    <span className="text-muted-foreground">Track Match Only - Correct track, wrong week (1 point)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">No Match - Track not in schedule (0 points)</span>
                  </div>
                </div>
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
