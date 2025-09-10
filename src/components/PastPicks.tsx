import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Calendar, Target, Medal, ChevronDown, ChevronUp, CheckCircle2, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { usePastPredictions, type PastPredictionWithResult, type WeeklyScore } from '@/hooks/usePastPredictions'

interface PastPicksProps {
  seasonId: string | null
}

function formatDriverName(driver: PastPredictionWithResult['predicted_driver']) {
  const name = `${driver.first_name || ''} ${driver.last_name || ''}`.trim() || driver.short_name
  return driver.driver_number ? `#${driver.driver_number} ${name}` : name
}

function getPositionColor(position?: number) {
  if (!position) return 'text-muted-foreground'
  if (position === 1) return 'text-yellow-500' // Gold
  if (position === 2) return 'text-gray-400' // Silver
  if (position === 3) return 'text-amber-600' // Bronze
  if (position <= 5) return 'text-green-600'
  if (position <= 10) return 'text-blue-600'
  return 'text-red-600'
}

function WeeklyScoreCard({ week }: { week: WeeklyScore }) {
  const avgPerPrediction = week.total_points / week.prediction_count
  
  return (
    <div className="bg-gradient-to-br from-card to-card/50 border border-border rounded-xl p-5 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        {/* Week & Track Info */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-xl flex items-center justify-center font-bold text-lg shadow-md">
              {week.week}
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-card"></div>
          </div>
          <div>
            <h3 className="font-bold text-xl text-card-foreground leading-tight">{week.track_name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="text-sm text-muted-foreground">
                {week.race_date && new Date(week.race_date).toLocaleDateString()}
              </div>
              <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
              <div className="text-sm text-muted-foreground">
                Week {week.week}
              </div>
            </div>
          </div>
        </div>

        {/* Score Display */}
        <div className="text-right">
          <div className="text-3xl font-black text-primary tracking-tight">
            {week.total_points}
          </div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Total Points
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-muted/30 rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Predictions Made
          </span>
          <span className="font-semibold text-card-foreground">
            {week.prediction_count}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Average Score
          </span>
          <span className="font-semibold text-card-foreground">
            {avgPerPrediction.toFixed(1)} pts
          </span>
        </div>
      </div>
    </div>
  )
}

function PredictionRow({ prediction }: { prediction: PastPredictionWithResult }) {
  const hasResult = prediction.finish_position !== undefined
  const isMissingPrediction = prediction.predicted_driver.short_name === 'No Prediction'
  
  return (
    <motion.div
      layout
      className={`grid grid-cols-12 gap-3 p-3 border rounded-lg transition-colors ${
        isMissingPrediction 
          ? 'border-destructive/30 bg-destructive/5 hover:bg-destructive/10' 
          : 'border-border hover:bg-muted/20'
      }`}
    >
      {/* Division & Split */}
      <div className="col-span-2 flex items-center">
        <div className="text-center">
          <div className="text-sm font-medium">D{prediction.division}</div>
          <div className={`text-xs px-1 rounded ${
            prediction.split === 'Gold' 
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' 
              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
          }`}>
            {prediction.split}
          </div>
        </div>
      </div>

      {/* Driver */}
      <div className="col-span-4 flex items-center">
        <div className="flex items-center gap-2">
          {isMissingPrediction && (
            <div className="w-2 h-2 bg-destructive rounded-full"></div>
          )}
          <div>
            <div className={`font-medium text-sm ${
              isMissingPrediction ? 'text-destructive italic' : ''
            }`}>
              {isMissingPrediction ? 'No Prediction Made' : formatDriverName(prediction.predicted_driver)}
            </div>
            {isMissingPrediction && (
              <div className="text-xs text-destructive/70">
                Penalty Applied
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Result */}
      <div className="col-span-3 flex items-center justify-center">
        {hasResult ? (
          <div className="flex items-center gap-2">
            {isMissingPrediction ? (
              <>
                <div className="h-4 w-4 text-destructive">⚠️</div>
                <span className="font-medium text-destructive">
                  Penalty
                </span>
              </>
            ) : (
              <>
                <Medal className={`h-4 w-4 ${getPositionColor(prediction.finish_position)}`} />
                <span className={`font-medium ${getPositionColor(prediction.finish_position)}`}>
                  {prediction.finish_position && prediction.finish_position > 15 ? 'DNF' : `P${prediction.finish_position}`}
                </span>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Pending</span>
          </div>
        )}
      </div>

      {/* Points */}
      <div className="col-span-2 flex items-center justify-center">
        <div className={`font-semibold ${
          hasResult 
            ? isMissingPrediction 
              ? 'text-destructive' 
              : 'text-card-foreground' 
            : 'text-muted-foreground'
        }`}>
          {hasResult ? `${prediction.points} pts` : 'Pending'}
        </div>
      </div>

      {/* Status */}
      <div className="col-span-1 flex items-center justify-center">
        {hasResult ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
          <Clock className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
    </motion.div>
  )
}

export function PastPicks({ seasonId }: PastPicksProps) {
  const { pastPredictions, weeklyScores, totalScore, loading, error } = usePastPredictions(seasonId)
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null)

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">Loading past picks...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            Error loading past picks: {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (pastPredictions.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No past predictions found.</p>
            <p className="text-sm">Make your first predictions above!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const weeklyPredictions = pastPredictions.reduce((acc, prediction) => {
    if (!acc[prediction.week]) {
      acc[prediction.week] = []
    }
    acc[prediction.week].push(prediction)
    return acc
  }, {} as Record<number, PastPredictionWithResult[]>)

  const completedWeeks = weeklyScores // Only includes weeks with actual results now
  const avgScore = completedWeeks.length > 0 
    ? totalScore / completedWeeks.length  // Total points divided by number of completed weeks
    : 0

  return (
    <div className="space-y-6">
      {/* Overall Score Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Your Season Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <div className="text-2xl font-bold text-primary">{totalScore}</div>
              <div className="text-sm text-muted-foreground">Total Points</div>
            </div>
            <div className="text-center p-4 bg-secondary rounded-lg">
              <div className="text-2xl font-bold text-card-foreground">{completedWeeks.length}</div>
              <div className="text-sm text-muted-foreground">Weeks Completed</div>
            </div>
            <div className="text-center p-4 bg-accent rounded-lg">
              <div className="text-2xl font-bold text-card-foreground">
                {avgScore > 0 ? avgScore.toFixed(1) : '--'}
              </div>
              <div className="text-sm text-muted-foreground">Avg Points/Week</div>
              <div className="text-xs text-muted-foreground mt-1">Lower is better</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Scores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Weekly Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {weeklyScores.map((week) => (
              <div key={week.week}>
                <button
                  className="w-full text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-xl"
                  onClick={() => setExpandedWeek(expandedWeek === week.week ? null : week.week)}
                >
                  <div className="space-y-3">
                    <WeeklyScoreCard week={week} />
                    <div className="flex justify-center">
                      <div className="bg-background/80 backdrop-blur-sm rounded-full p-1.5 border border-border hover:bg-background transition-colors">
                        {expandedWeek === week.week ? 
                          <ChevronUp className="h-4 w-4 text-muted-foreground" /> : 
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        }
                      </div>
                    </div>
                  </div>
                </button>

                <AnimatePresence>
                  {expandedWeek === week.week && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-3 space-y-2 overflow-hidden"
                    >
                      {/* Header */}
                      <div className="grid grid-cols-12 gap-3 p-3 text-sm font-medium text-muted-foreground border-b border-border">
                        <div className="col-span-2">Division</div>
                        <div className="col-span-4">Driver</div>
                        <div className="col-span-3 text-center">Result</div>
                        <div className="col-span-2 text-center">Points</div>
                        <div className="col-span-1 text-center">Status</div>
                      </div>

                      {/* Predictions for this week */}
                      {weeklyPredictions[week.week]?.map((prediction) => (
                        <PredictionRow key={prediction.id} prediction={prediction} />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}