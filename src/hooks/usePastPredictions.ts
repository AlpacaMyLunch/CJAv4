import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { SPLITS } from '@/constants'

// Interface for race results from the database
interface RaceResult {
  schedule_id: string
  division: number
  split: string
  driver_id: string
  split_position: number
}

// Interface for schedule with track data from joined queries
interface ScheduleWithTrack {
  id: string
  week: number
  race_date: string | null
  season_id: string
  track: {
    name: string
  } | null
}

// Interface for driver data from joined queries
interface DriverData {
  id: string
  first_name: string | null
  last_name: string | null
  short_name: string
  driver_number: number | null
}

// Interface for prediction with joined schedule and driver data
interface PredictionWithJoins {
  id: string
  division: number
  split: string
  driver_id: string
  schedule_id: string
  schedule: ScheduleWithTrack | null
  driver: DriverData | null
}

// Interface for leaderboard prediction (less data needed)
interface LeaderboardPrediction {
  user_id: string
  division: number
  split: string
  driver_id: string
  schedule_id: string
  schedule: {
    id: string
    week: number
    season_id: string
  } | null
}

// Interface for unique schedule data extracted from predictions
interface UniqueSchedule {
  id: string
  week: number
  track_name: string
  race_date?: string
}

// Interface for unique leaderboard schedule data
interface UniqueLeaderboardSchedule {
  id: string
  week: number
}

export type PastPredictionWithResult = {
  id: string
  week: number
  track_name: string
  division: number
  split: 'Gold' | 'Silver'
  predicted_driver: {
    id: string
    first_name: string | null
    last_name: string | null
    short_name: string
    driver_number: number | null
  }
  finish_position?: number  // null if race hasn't finished yet
  points: number  // Lower is better (golf scoring)
  race_date?: string
}

export type WeeklyScore = {
  week: number
  track_name: string
  total_points: number
  prediction_count: number
  race_date?: string
}

export type LeaderboardEntry = {
  user_id: string
  user_name: string
  total_points: number
  weeks_participated: number
  average_points: number
  position_change?: {
    change: number // positive = moved up, negative = moved down, 0 = no change
    is_new: boolean // true if this is their first appearance
  }
}

export function usePastPredictions(seasonId: string | null) {
  const { user } = useAuth()
  const [pastPredictions, setPastPredictions] = useState<PastPredictionWithResult[]>([])
  const [weeklyScores, setWeeklyScores] = useState<WeeklyScore[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [totalScore, setTotalScore] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user || !seasonId) {
      setPastPredictions([])
      setWeeklyScores([])
      setLeaderboard([])
      setTotalScore(0)
      return
    }

    const fetchPastPredictions = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch user's predictions with schedule and driver info
        const { data: predictionsData, error: predictionsError } = await supabase
          .from('predictions')
          .select(`
            id,
            division,
            split,
            driver_id,
            schedule_id,
            schedule!inner (
              id,
              week,
              race_date,
              season_id,
              track:tracks (
                name
              )
            ),
            driver:drivers_public!inner (
              id,
              first_name,
              last_name,
              short_name,
              driver_number
            )
          `)
          .eq('user_id', user.id)
          .eq('schedule.season_id', seasonId)

        const typedPredictionsData = predictionsData as unknown as PredictionWithJoins[] | null

        if (predictionsError) {
          throw new Error(`Failed to fetch predictions: ${predictionsError.message}`)
        }

        // Fetch race results for these predictions
        const scheduleIds = typedPredictionsData?.map(p => p.schedule?.id).filter((id): id is string => id !== null && id !== undefined) || []

        let resultsData: RaceResult[] = []
        let participantCounts: Record<string, number> = {} // Track participants per division/split/schedule
        
        if (scheduleIds.length > 0) {
          const { data: results, error: resultsError } = await supabase
            .from('race_results_public')
            .select('schedule_id, division, split, driver_id, split_position')
            .in('schedule_id', scheduleIds)

          if (resultsError) {
            throw new Error(`Failed to fetch results: ${resultsError.message}`)
          }
          resultsData = results || []
          
          // Calculate participant counts for each schedule/division/split combination
          resultsData.forEach(result => {
            const key = `${result.schedule_id}-${result.division}-${result.split}`
            participantCounts[key] = (participantCounts[key] || 0) + 1
          })
        }

        // First, identify all possible division/split combinations that should have been predicted
        const allPossibleCombinations: Array<{schedule_id: string, week: number, track_name: string, division: number, split: 'Gold' | 'Silver', race_date?: string}> = []

        // Get unique schedules from predictions
        const uniqueSchedules: UniqueSchedule[] = [...new Map((typedPredictionsData || []).map(p => [
          p.schedule?.id,
          {
            id: p.schedule?.id || '',
            week: p.schedule?.week || 0,
            track_name: p.schedule?.track?.name || 'Unknown',
            race_date: p.schedule?.race_date || undefined
          }
        ])).values()].filter((s): s is UniqueSchedule => !!s.id)

        // For each schedule, create all possible division/split combinations
        uniqueSchedules.forEach(schedule => {
          for (let division = 1; division <= 6; division++) {
            ['Gold', 'Silver'].forEach(split => {
              allPossibleCombinations.push({
                schedule_id: schedule.id,
                week: schedule.week,
                track_name: schedule.track_name,
                division,
                split: split as 'Gold' | 'Silver',
                race_date: schedule.race_date
              })
            })
          }
        })

        // Process actual predictions with results
        const actualPredictions: PastPredictionWithResult[] = (typedPredictionsData || []).map(prediction => {
          const result = resultsData.find(r => 
            r.schedule_id === prediction.schedule?.id &&
            r.division === prediction.division &&
            r.split === prediction.split &&
            r.driver_id === prediction.driver_id
          )

          // Check if this race has any results for this division/split
          const raceKey = `${prediction.schedule?.id}-${prediction.division}-${prediction.split}`
          const raceHasResults = participantCounts[raceKey] > 0
          
          let points = 0
          let finishPosition: number | undefined = undefined
          let hasResult = false
          
          if (raceHasResults) {
            if (result?.split_position) {
              // Driver participated and finished in their split
              hasResult = true
              points = result.split_position
              finishPosition = result.split_position
            } else {
              // Driver was predicted but didn't participate (DNF/no-show)
              hasResult = true
              points = participantCounts[raceKey] + 1 // Last place + 1 in their split
              finishPosition = participantCounts[raceKey] + 1
            }
          }
          // If raceHasResults is false, no results exist yet (points = 0, hasResult = false)

          return {
            id: prediction.id,
            week: prediction.schedule?.week || 0,
            track_name: prediction.schedule?.track?.name || 'Unknown',
            division: prediction.division,
            split: prediction.split,
            predicted_driver: {
              id: prediction.driver?.id || '',
              first_name: prediction.driver?.first_name,
              last_name: prediction.driver?.last_name,
              short_name: prediction.driver?.short_name || 'Unknown',
              driver_number: prediction.driver?.driver_number
            },
            finish_position: finishPosition,
            points,
            race_date: prediction.schedule?.race_date
          }
        })

        // Add missing predictions as penalty scores for races that have results
        const missingPredictions: PastPredictionWithResult[] = []
        
        allPossibleCombinations.forEach(combo => {
          // Check if this race has results
          const raceKey = `${combo.schedule_id}-${combo.division}-${combo.split}`
          const raceHasResults = participantCounts[raceKey] > 0
          
          if (raceHasResults) {
            // Check if user made a prediction for this combination
            const userMadePrediction = actualPredictions.some(p => 
              p.week === combo.week &&
              p.division === combo.division &&
              p.split === combo.split
            )
            
            if (!userMadePrediction) {
              // Add penalty for missing prediction
              const penaltyPoints = participantCounts[raceKey] + 1 // Last place + 1
              
              missingPredictions.push({
                id: `missing-${combo.schedule_id}-${combo.division}-${combo.split}`,
                week: combo.week,
                track_name: combo.track_name,
                division: combo.division,
                split: combo.split,
                predicted_driver: {
                  id: '',
                  first_name: null,
                  last_name: null,
                  short_name: 'No Prediction',
                  driver_number: null
                },
                finish_position: penaltyPoints,
                points: penaltyPoints,
                race_date: combo.race_date
              })
            }
          }
        })

        // Combine actual predictions with missing prediction penalties
        const allPredictions = [...actualPredictions, ...missingPredictions]
        setPastPredictions(allPredictions)

        // Calculate weekly scores (including penalty predictions)
        const weeklyScoreMap = new Map<number, WeeklyScore>()
        allPredictions
          .filter(prediction => prediction.finish_position !== undefined) // Only include predictions with results
          .forEach(prediction => {
            const existing = weeklyScoreMap.get(prediction.week)
            if (existing) {
              existing.total_points += prediction.points
              existing.prediction_count += 1
            } else {
              weeklyScoreMap.set(prediction.week, {
                week: prediction.week,
                track_name: prediction.track_name,
                total_points: prediction.points,
                prediction_count: 1,
                race_date: prediction.race_date
              })
            }
          })

        const weeklyScoresArray = Array.from(weeklyScoreMap.values()).sort((a, b) => a.week - b.week)
        setWeeklyScores(weeklyScoresArray)

        // Calculate total score (including penalty predictions)
        const totalPoints = allPredictions
          .filter(p => p.finish_position !== undefined)
          .reduce((sum, p) => sum + p.points, 0)
        setTotalScore(totalPoints)

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchPastPredictions()
  }, [user, seasonId])

  // Fetch leaderboard separately
  useEffect(() => {
    if (!seasonId) {
      setLeaderboard([])
      return
    }

    const fetchLeaderboard = async () => {
      try {
        // Get all predictions for the season with results
        const { data: allPredictions, error: predictionsError } = await supabase
          .from('predictions')
          .select(`
            user_id,
            division,
            split,
            driver_id,
            schedule_id,
            schedule!inner (
              id,
              week,
              season_id
            )
          `)
          .eq('schedule.season_id', seasonId)

        const typedAllPredictions = allPredictions as unknown as LeaderboardPrediction[] | null

        if (predictionsError) {
          throw new Error(`Failed to fetch leaderboard predictions: ${predictionsError.message}`)
        }

        // Get all results for the season
        const scheduleIds = typedAllPredictions?.map(p => p.schedule?.id).filter((id): id is string => id !== null && id !== undefined) || []

        let resultsData: RaceResult[] = []
        let leaderboardParticipantCounts: Record<string, number> = {}
        
        if (scheduleIds.length > 0) {
          const { data: results, error: resultsError } = await supabase
            .from('race_results_public')
            .select('schedule_id, division, split, driver_id, split_position')
            .in('schedule_id', scheduleIds)

          if (resultsError) {
            throw new Error(`Failed to fetch leaderboard results: ${resultsError.message}`)
          }
          resultsData = results || []
          
          // Calculate participant counts for leaderboard
          resultsData.forEach(result => {
            const key = `${result.schedule_id}-${result.division}-${result.split}`
            leaderboardParticipantCounts[key] = (leaderboardParticipantCounts[key] || 0) + 1
          })
        }

        // Fetch user display names from the public view
        const userIds = [...new Set(typedAllPredictions?.map(p => p.user_id) || [])]
        const userNames = new Map<string, string>()

        if (userIds.length > 0) {
          const { data: userProfiles, error: profilesError } = await supabase
            .from('user_profiles_public')
            .select('user_id, display_name')
            .in('user_id', userIds)

          if (!profilesError && userProfiles) {
            userProfiles.forEach(profile => {
              userNames.set(profile.user_id, profile.display_name)
            })
          }
        }

        // Calculate scores per user
        const userScores = new Map<string, { total_points: number, weeks: Set<number> }>()

        // Create all possible combinations for leaderboard calculation too
        const allLeaderboardCombinations: Array<{schedule_id: string, week: number, division: number, split: 'Gold' | 'Silver', user_id: string}> = []

        // Get unique schedules and users from predictions
        const uniqueSchedulesLeaderboard: UniqueLeaderboardSchedule[] = [...new Map((typedAllPredictions || []).map(p => [
          p.schedule?.id,
          {
            id: p.schedule?.id || '',
            week: p.schedule?.week || 0
          }
        ])).values()].filter((s): s is UniqueLeaderboardSchedule => !!s.id)

        const uniqueUsers = [...new Set(typedAllPredictions?.map(p => p.user_id) || [])]
        
        // For each user and schedule, create all possible division/split combinations
        uniqueUsers.forEach(userId => {
          uniqueSchedulesLeaderboard.forEach(schedule => {
            for (let division = 1; division <= 6; division++) {
              SPLITS.forEach(split => {
                allLeaderboardCombinations.push({
                  schedule_id: schedule.id,
                  week: schedule.week,
                  division,
                  split: split as 'Gold' | 'Silver',
                  user_id: userId
                })
              })
            }
          })
        })

        // Process each user's mandatory full participation
        allLeaderboardCombinations.forEach(combo => {
          const raceKey = `${combo.schedule_id}-${combo.division}-${combo.split}`
          const raceHasResults = leaderboardParticipantCounts[raceKey] > 0

          if (raceHasResults) {
            // Check if user made a prediction for this combination
            const userPrediction = typedAllPredictions?.find(p => 
              p.user_id === combo.user_id &&
              p.schedule?.id === combo.schedule_id &&
              p.division === combo.division &&
              p.split === combo.split
            )
            
            let points: number
            if (userPrediction) {
              // Find the result for this prediction
              const result = resultsData.find(r => 
                r.schedule_id === combo.schedule_id &&
                r.division === combo.division &&
                r.split === combo.split &&
                r.driver_id === userPrediction.driver_id
              )
              
              if (result?.split_position) {
                // Driver participated and finished in their split
                points = result.split_position
              } else {
                // Driver was predicted but didn't participate (DNF/no-show)
                points = leaderboardParticipantCounts[raceKey] + 1
              }
            } else {
              // No prediction made - penalty points
              points = leaderboardParticipantCounts[raceKey] + 1
            }

            const existing = userScores.get(combo.user_id)
            if (existing) {
              existing.total_points += points
              existing.weeks.add(combo.week)
            } else {
              userScores.set(combo.user_id, {
                total_points: points,
                weeks: new Set([combo.week])
              })
            }
          }
        })

        // Convert to leaderboard entries and sort
        const currentLeaderboard: LeaderboardEntry[] = Array.from(userScores.entries())
          .map(([userId, scoreData]) => ({
            user_id: userId,
            user_name: userNames.get(userId) || 'Anonymous',
            total_points: scoreData.total_points,
            weeks_participated: scoreData.weeks.size,
            average_points: scoreData.weeks.size > 0 ? scoreData.total_points / scoreData.weeks.size : 0
          }))
          .sort((a, b) => a.total_points - b.total_points) // Lower is better (golf scoring)

        // Calculate position changes by comparing with previous week's standings
        const previousWeekLeaderboard = await calculatePreviousWeekLeaderboard(seasonId, uniqueSchedulesLeaderboard, userNames)
        
        const leaderboardEntries = currentLeaderboard.map((entry, currentIndex) => {
          const currentPosition = currentIndex + 1
          const previousPosition = previousWeekLeaderboard.findIndex(prev => prev.user_id === entry.user_id) + 1
          
          let position_change: LeaderboardEntry['position_change']
          
          if (previousPosition === 0) {
            // New player - first appearance
            position_change = {
              change: 0,
              is_new: true
            }
          } else {
            // Existing player - calculate change
            const change = previousPosition - currentPosition // positive = moved up, negative = moved down
            position_change = {
              change,
              is_new: false
            }
          }
          
          return {
            ...entry,
            position_change
          }
        })

        setLeaderboard(leaderboardEntries)

      } catch (err) {
        console.error('Failed to fetch leaderboard:', err)
      }
    }

    fetchLeaderboard()
  }, [seasonId])

  // Helper function to calculate previous week's leaderboard for position comparison
  const calculatePreviousWeekLeaderboard = async (
    seasonId: string,
    currentSchedules: UniqueLeaderboardSchedule[],
    userNames: Map<string, string>
  ): Promise<LeaderboardEntry[]> => {
    try {
      // Find the previous week (max week - 1)
      const maxWeek = Math.max(...currentSchedules.map(s => s.week || 0))
      const previousWeek = maxWeek - 1
      
      if (previousWeek < 1) {
        return [] // No previous week data
      }
      
      // Get predictions up to the previous week only
      const { data: prevPredictions, error: prevError } = await supabase
        .from('predictions')
        .select(`
          user_id,
          division,
          split,
          driver_id,
          schedule_id,
          schedule!inner (
            id,
            week,
            season_id
          )
        `)
        .eq('schedule.season_id', seasonId)
        .lte('schedule.week', previousWeek)

      const typedPrevPredictions = prevPredictions as unknown as LeaderboardPrediction[] | null

      if (prevError || !typedPrevPredictions) {
        return []
      }

      // Get results up to the previous week
      const prevScheduleIds = typedPrevPredictions.map(p => p.schedule_id)
      const { data: prevResults, error: prevResultsError } = await supabase
        .from('race_results_public')
        .select('schedule_id, division, split, driver_id, split_position')
        .in('schedule_id', prevScheduleIds)

      if (prevResultsError) {
        return []
      }

      // Calculate participant counts for previous weeks
      const prevParticipantCounts: Record<string, number> = {}
      prevResults?.forEach(result => {
        const key = `${result.schedule_id}-${result.division}-${result.split}`
        prevParticipantCounts[key] = (prevParticipantCounts[key] || 0) + 1
      })

      // Calculate previous week scores using the same logic
      const prevUserScores = new Map<string, { total_points: number, weeks: Set<number> }>()

      // Get unique users and schedules for previous weeks
      const prevUniqueUsers = [...new Set(typedPrevPredictions.map(p => p.user_id))]
      const prevUniqueSchedules: UniqueLeaderboardSchedule[] = [...new Map(typedPrevPredictions.map(p => [
        p.schedule_id,
        {
          id: p.schedule_id,
          week: p.schedule?.week || 0
        }
      ])).values()]

      // Apply mandatory participation for previous weeks
      prevUniqueUsers.forEach(userId => {
        prevUniqueSchedules.forEach(schedule => {
          for (let division = 1; division <= 6; division++) {
            ['Gold', 'Silver'].forEach(split => {
              const raceKey = `${schedule.id}-${division}-${split}`
              const raceHasResults = prevParticipantCounts[raceKey] > 0

              if (raceHasResults) {
                const userPrediction = typedPrevPredictions.find(p => 
                  p.user_id === userId &&
                  p.schedule_id === schedule.id &&
                  p.division === division &&
                  p.split === split
                )
                
                let points: number
                if (userPrediction) {
                  const result = prevResults?.find(r => 
                    r.schedule_id === schedule.id &&
                    r.division === division &&
                    r.split === split &&
                    r.driver_id === userPrediction.driver_id
                  )
                  
                  points = result?.split_position || (prevParticipantCounts[raceKey] + 1)
                } else {
                  points = prevParticipantCounts[raceKey] + 1
                }

                const existing = prevUserScores.get(userId)
                if (existing) {
                  existing.total_points += points
                  if (schedule.week) existing.weeks.add(schedule.week)
                } else {
                  prevUserScores.set(userId, {
                    total_points: points,
                    weeks: new Set(schedule.week ? [schedule.week] : [])
                  })
                }
              }
            })
          }
        })
      })

      // Convert to leaderboard format
      return Array.from(prevUserScores.entries())
        .map(([userId, scoreData]) => ({
          user_id: userId,
          user_name: userNames.get(userId) || 'Anonymous',
          total_points: scoreData.total_points,
          weeks_participated: scoreData.weeks.size,
          average_points: scoreData.weeks.size > 0 ? scoreData.total_points / scoreData.weeks.size : 0
        }))
        .sort((a, b) => a.total_points - b.total_points)

    } catch (error) {
      console.error('Error calculating previous week leaderboard:', error)
      return []
    }
  }

  return {
    pastPredictions,
    weeklyScores,
    leaderboard,
    totalScore,
    loading,
    error
  }
}