import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, TrendingUp, Trophy } from 'lucide-react'

interface StatsOverviewProps {
  totalUsers: number
  usersWithNostradouglas: number
  usersWithCommunityPredictions: number
  totalNostradouglas: number
  totalCommunityPredictions: number
}

export function StatsOverview({
  totalUsers,
  usersWithNostradouglas,
  usersWithCommunityPredictions,
  totalNostradouglas,
  totalCommunityPredictions
}: StatsOverviewProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalUsers}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Nostradouglas Users</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{usersWithNostradouglas}</div>
          <p className="text-xs text-muted-foreground">
            {totalUsers > 0 ? Math.round((usersWithNostradouglas / totalUsers) * 100) : 0}% of users
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Community Users</CardTitle>
          <Trophy className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{usersWithCommunityPredictions}</div>
          <p className="text-xs text-muted-foreground">
            {totalUsers > 0 ? Math.round((usersWithCommunityPredictions / totalUsers) * 100) : 0}% of users
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Nostradouglas</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalNostradouglas}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Community</CardTitle>
          <Trophy className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalCommunityPredictions}</div>
        </CardContent>
      </Card>
    </div>
  )
}
