import { useState } from 'react'
import { Crown, Medal, Trophy, Users, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import {
  type ImsaEventLeaderboardRow,
  type ImsaSeasonLeaderboardRow,
  type ImsaAllTimeLeaderboardRow
} from '@/lib/supabase'

type LeaderboardRow = ImsaEventLeaderboardRow | ImsaSeasonLeaderboardRow | ImsaAllTimeLeaderboardRow

interface LeaderboardTableProps {
  data: LeaderboardRow[]
  type: 'event' | 'season' | 'all-time'
  title?: string
  loading?: boolean
  currentUserId?: string
  className?: string
  onUserClick?: (userId: string, displayName: string) => void
}

function getRankIcon(rank: number) {
  if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />
  if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />
  if (rank === 3) return <Trophy className="h-5 w-5 text-amber-600" />
  return <span className="text-sm font-semibold text-muted-foreground">#{rank}</span>
}

function getRowStyles(rank: number, isCurrentUser: boolean) {
  if (isCurrentUser) {
    return {
      bg: 'bg-primary/10 border-l-4 border-l-primary',
      text: 'text-foreground',
      muted: 'text-muted-foreground'
    }
  }
  if (rank === 1) return {
    bg: 'bg-gradient-to-r from-yellow-50 to-transparent dark:from-yellow-900/20',
    text: 'text-yellow-900 dark:text-yellow-100',
    muted: 'text-yellow-700 dark:text-yellow-300'
  }
  if (rank === 2) return {
    bg: 'bg-gradient-to-r from-gray-100 to-transparent dark:from-gray-800/30',
    text: 'text-gray-900 dark:text-gray-100',
    muted: 'text-gray-600 dark:text-gray-300'
  }
  if (rank === 3) return {
    bg: 'bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-900/20',
    text: 'text-amber-900 dark:text-amber-100',
    muted: 'text-amber-700 dark:text-amber-300'
  }
  return { bg: '', text: 'text-card-foreground', muted: 'text-muted-foreground' }
}

export function LeaderboardTable({
  data,
  type,
  title,
  loading,
  currentUserId,
  className,
  onUserClick
}: LeaderboardTableProps) {
  // const [expandedUserId, setExpandedUserId] = useState<string | null>(null)
  const defaultTitles: Record<string, string> = {
    'event': 'Event Leaderboard',
    'season': 'Season Leaderboard',
    'all-time': 'All-Time Leaderboard'
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            {title || defaultTitles[type]}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSpinner size="sm" message="Loading leaderboard..." center />
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            {title || defaultTitles[type]}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No predictions yet. Be the first!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const showEventsColumn = type !== 'event'
  const showAvgColumn = type !== 'event'

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          {title || defaultTitles[type]}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Name
                </th>
                {showEventsColumn && (
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Events
                  </th>
                )}
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Podium
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Mfr
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total
                </th>
                {showAvgColumn && (
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Avg
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((row) => {
                const isCurrentUser = row.user_id === currentUserId
                const podiumPts = 'podium_points' in row ? row.podium_points : row.total_podium_points
                const mfrPts = 'manufacturer_points' in row ? row.manufacturer_points : row.total_manufacturer_points
                const eventsCount = 'events_participated' in row ? row.events_participated : null
                const avgPts = 'avg_points_per_event' in row ? row.avg_points_per_event : null
                const styles = getRowStyles(row.rank, isCurrentUser)
                // const isExpanded = expandedUserId === row.user_id
                const isClickable = !!onUserClick

                return (
                  <tr
                    key={row.user_id}
                    onClick={isClickable ? () => onUserClick(row.user_id, row.display_name || 'Unknown') : undefined}
                    className={cn(
                      'transition-colors',
                      styles.bg,
                      isClickable && 'cursor-pointer hover:bg-muted/30'
                    )}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center justify-center w-8">
                        {getRankIcon(row.rank)}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'text-sm font-medium',
                          isCurrentUser ? 'text-primary font-semibold' : styles.text
                        )}>
                          {row.display_name || 'Unknown'}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                              You
                            </span>
                          )}
                        </span>
                        {isClickable && (
                          <ChevronDown className={cn('h-4 w-4', styles.muted)} />
                        )}
                      </div>
                    </td>
                    {showEventsColumn && (
                      <td className={cn('px-4 py-3 whitespace-nowrap text-sm text-center', styles.muted)}>
                        {eventsCount}
                      </td>
                    )}
                    <td className={cn('px-4 py-3 whitespace-nowrap text-sm text-center', styles.muted)}>
                      {podiumPts}
                    </td>
                    <td className={cn('px-4 py-3 whitespace-nowrap text-sm text-center', styles.muted)}>
                      {mfrPts}
                    </td>
                    <td className={cn('px-4 py-3 whitespace-nowrap text-sm text-center font-semibold', styles.text)}>
                      {row.total_points}
                    </td>
                    {showAvgColumn && avgPts !== null && (
                      <td className={cn('px-4 py-3 whitespace-nowrap text-sm text-center', styles.muted)}>
                        {typeof avgPts === 'number' ? avgPts.toFixed(1) : avgPts}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
