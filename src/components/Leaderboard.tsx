import { Crown, Medal, Trophy, Users, TrendingUp, TrendingDown, Minus, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePastPredictions, type LeaderboardEntry } from '@/hooks/usePastPredictions'
import { useAuth } from '@/hooks/useAuth'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface LeaderboardProps {
  seasonId: string | null
}

function getPositionIcon(position: number) {
  if (position === 1) return <Crown className="h-5 w-5 text-yellow-500" />
  if (position === 2) return <Medal className="h-5 w-5 text-gray-400" />
  if (position === 3) return <Trophy className="h-5 w-5 text-amber-600" />
  return <div className="w-5 h-5 flex items-center justify-center text-sm font-semibold text-muted-foreground">#{position}</div>
}

function getPositionBg(position: number, isCurrentUser: boolean) {
  const baseClasses = "transition-all duration-200 hover:bg-muted/30"
  
  if (isCurrentUser) {
    return `${baseClasses} bg-primary/10 border-l-4 border-l-primary`
  }
  
  if (position === 1) return `${baseClasses} bg-gradient-to-r from-yellow-50 to-transparent dark:from-yellow-900/20`
  if (position === 2) return `${baseClasses} bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-800/20`
  if (position === 3) return `${baseClasses} bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-900/20`
  
  return baseClasses
}

function PositionChangeIndicator({ positionChange }: { positionChange?: LeaderboardEntry['position_change'] }) {
  if (!positionChange) return null

  if (positionChange.is_new) {
    return (
      <div className="flex items-center gap-1 text-xs">
        <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center">
          <Plus className="w-2.5 h-2.5" />
        </div>
        <span className="text-blue-600 dark:text-blue-400 font-medium">NEW</span>
      </div>
    )
  }

  const change = positionChange.change
  if (change === 0) {
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="w-3 h-3" />
        <span>-</span>
      </div>
    )
  }

  const isPositive = change > 0
  const absChange = Math.abs(change)
  const isSignificant = absChange >= 3

  // Determine colors based on significance and direction
  let colorClasses: string
  if (isPositive) {
    // Moved up (positive change is good)
    colorClasses = isSignificant 
      ? 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900' 
      : 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900'
  } else {
    // Moved down (negative change is bad)
    colorClasses = isSignificant 
      ? 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900'
      : 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900'
  }

  const Icon = isPositive ? TrendingUp : TrendingDown

  return (
    <div className="flex items-center gap-1 text-xs">
      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${colorClasses}`}>
        <Icon className="w-2.5 h-2.5" />
      </div>
      <span className={`font-medium ${colorClasses.split(' ')[0]} ${colorClasses.split(' ')[1]}`}>
        {absChange}
      </span>
    </div>
  )
}

function LeaderboardRow({ entry, position, isCurrentUser }: { 
  entry: LeaderboardEntry, 
  position: number, 
  isCurrentUser: boolean 
}) {
  return (
    <div className={`grid grid-cols-[3rem_1fr_5rem_7rem_4rem_6rem] gap-4 p-4 border-b border-border last:border-b-0 ${getPositionBg(position, isCurrentUser)}`}>
      {/* Position */}
      <div className="flex items-center">
        {getPositionIcon(position)}
      </div>

      {/* User Name */}
      <div className="flex items-center">
        <div>
          <div className={`font-medium ${isCurrentUser ? 'text-primary font-semibold' : 'text-card-foreground'}`}>
            {entry.user_name}
            {isCurrentUser && <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">You</span>}
          </div>
        </div>
      </div>

      {/* Position Change */}
      <div className="flex items-center justify-center">
        <PositionChangeIndicator positionChange={entry.position_change} />
      </div>

      {/* Total Points */}
      <div className="flex items-center justify-center">
        <div className="text-center">
          <div className={`text-lg font-semibold ${position <= 3 ? 'text-primary' : 'text-card-foreground'}`}>
            {entry.total_points}
          </div>
          <div className="text-xs text-muted-foreground">points</div>
        </div>
      </div>

      {/* Weeks Participated */}
      <div className="flex items-center justify-center">
        <div className="text-center">
          <div className="font-medium text-card-foreground">{entry.weeks_participated}</div>
          <div className="text-xs text-muted-foreground">weeks</div>
        </div>
      </div>

      {/* Average */}
      <div className="flex items-center justify-center">
        <div className="text-center">
          <div className="font-medium text-card-foreground">
            {entry.average_points > 0 ? entry.average_points.toFixed(1) : '--'}
          </div>
          <div className="text-xs text-muted-foreground">avg/week</div>
        </div>
      </div>
    </div>
  )
}

export function Leaderboard({ seasonId }: LeaderboardProps) {
  const { user } = useAuth()
  const { leaderboard, loading, error } = usePastPredictions(seasonId)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Season Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="sm" message="Loading leaderboard..." />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Season Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-destructive py-8">
            Error loading leaderboard: {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (leaderboard.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Season Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No completed races yet.</p>
            <p className="text-sm">The leaderboard will appear after the first race results are in!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentUserEntry = leaderboard.find(entry => entry.user_id === user?.id)
  const currentUserPosition = currentUserEntry ? leaderboard.indexOf(currentUserEntry) + 1 : null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Season Leaderboard
          <span className="text-sm font-normal text-muted-foreground ml-auto">
            Lower is better (golf scoring)
          </span>
        </CardTitle>
        {currentUserPosition && (
          <div className="text-sm text-muted-foreground">
            You're currently in <span className="font-semibold text-primary">#{currentUserPosition}</span> place
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {/* Header */}
        <div className="grid grid-cols-[3rem_1fr_5rem_7rem_4rem_6rem] gap-4 p-4 bg-muted/50 text-sm font-medium text-muted-foreground border-b border-border">
          <div>Rank</div>
          <div>Player</div>
          <div className="text-center">Change</div>
          <div className="text-center">Total Points</div>
          <div className="text-center">Weeks</div>
          <div className="text-center">Average</div>
        </div>

        {/* Leaderboard Entries */}
        <div className="max-h-96 overflow-y-auto">
          {leaderboard.map((entry, index) => (
            <LeaderboardRow
              key={entry.user_id}
              entry={entry}
              position={index + 1}
              isCurrentUser={entry.user_id === user?.id}
            />
          ))}
        </div>

        {/* Footer Info */}
        <div className="p-4 bg-muted/20 border-t border-border">
          <div className="text-xs text-muted-foreground text-center">
            <p>🏆 Golf-style scoring: lower points = better performance</p>
            <p>Points are awarded based on your predicted driver's finishing position</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}