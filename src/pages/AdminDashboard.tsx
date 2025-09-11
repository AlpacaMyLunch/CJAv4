import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase, type UserProfilePublic, type Prediction, type Track } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  TrendingUp, 
  RefreshCw, 
  Calendar,
  Trophy,
  Loader2
} from 'lucide-react'

interface UserWithPredictions {
  user_id: string
  display_name: string
  created_at: string
  predictions: Array<{
    id: string
    track_id: string
    track_name: string
    position: number
  }>
  prediction_count: number
}

export function AdminDashboard() {
  const { user, isAdmin } = useAuth()
  const [users, setUsers] = useState<UserWithPredictions[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalUsers: 0,
    usersWithPredictions: 0,
    totalPredictions: 0
  })

  const fetchAdminData = async () => {
    if (!user || !isAdmin) return

    try {
      setError(null)
      
      // Fetch all users
      const { data: usersData, error: usersError } = await supabase
        .from('user_profiles_public')
        .select('*')
        .order('created_at', { ascending: false })

      if (usersError) throw usersError

      // Fetch current season
      const { data: seasonData, error: seasonError } = await supabase
        .from('seasons')
        .select('*')
        .order('season_number', { ascending: false })
        .limit(1)

      if (seasonError) throw seasonError
      
      const currentSeason = seasonData?.[0]
      
      if (!currentSeason) {
        setUsers(usersData?.map(user => ({
          ...user,
          predictions: [],
          prediction_count: 0
        })) || [])
        setStats({
          totalUsers: usersData?.length || 0,
          usersWithPredictions: 0,
          totalPredictions: 0
        })
        return
      }

      // Fetch all predictions for current season with track names
      const { data: predictionsData, error: predictionsError } = await supabase
        .from('predictions')
        .select(`
          *,
          tracks (
            name
          )
        `)
        .eq('season_id', currentSeason.id)
        .order('position', { ascending: true })

      if (predictionsError) throw predictionsError

      // Group predictions by user
      const userPredictions = new Map<string, Array<{
        id: string
        track_id: string
        track_name: string
        position: number
      }>>()

      predictionsData?.forEach(prediction => {
        const userId = prediction.user_id
        if (!userPredictions.has(userId)) {
          userPredictions.set(userId, [])
        }
        userPredictions.get(userId)?.push({
          id: prediction.id,
          track_id: prediction.track_id,
          track_name: (prediction.tracks as any)?.name || 'Unknown Track',
          position: prediction.position
        })
      })

      // Combine users with their predictions
      const usersWithPredictions = usersData?.map(user => ({
        ...user,
        predictions: userPredictions.get(user.user_id) || [],
        prediction_count: userPredictions.get(user.user_id)?.length || 0
      })) || []

      setUsers(usersWithPredictions)
      setStats({
        totalUsers: usersData?.length || 0,
        usersWithPredictions: usersWithPredictions.filter(u => u.prediction_count > 0).length,
        totalPredictions: predictionsData?.length || 0
      })

    } catch (err) {
      console.error('Failed to fetch admin data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await fetchAdminData()
      setLoading(false)
    }
    
    loadData()
  }, [user, isAdmin])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAdminData()
    setRefreshing(false)
  }

  if (!user || !isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Access denied. This page is only available to administrators.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users and view predictions</p>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={refreshing}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users with Predictions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.usersWithPredictions}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalUsers > 0 ? Math.round((stats.usersWithPredictions / stats.totalUsers) * 100) : 0}% participation
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Predictions</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPredictions}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="predictions">Predictions Overview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                All registered users and their prediction status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div 
                    key={user.user_id} 
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-semibold">{user.display_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Joined {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={user.prediction_count > 0 ? "default" : "secondary"}>
                        {user.prediction_count} predictions
                      </Badge>
                      {user.prediction_count === 8 && (
                        <Badge variant="outline" className="text-green-600">
                          Complete
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Nostradouglas Predictions</CardTitle>
              <CardDescription>
                Current track predictions by user
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {users
                  .filter(user => user.prediction_count > 0)
                  .map((user) => (
                    <div key={user.user_id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">{user.display_name}</h3>
                        <Badge variant={user.prediction_count === 8 ? "default" : "secondary"}>
                          {user.prediction_count}/8 tracks
                        </Badge>
                      </div>
                      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                        {user.predictions
                          .sort((a, b) => a.position - b.position)
                          .map((prediction) => (
                            <div 
                              key={prediction.id}
                              className="flex items-center justify-between p-2 bg-muted rounded"
                            >
                              <span className="text-sm font-medium">
                                #{prediction.position}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {prediction.track_name}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                
                {users.filter(user => user.prediction_count > 0).length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No predictions have been made yet.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}