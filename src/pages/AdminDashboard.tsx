import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  Users, 
  TrendingUp, 
  RefreshCw,
  Trophy,
  Loader2
} from 'lucide-react'
import { PieChartComponent, type ChartData, type ChartConfig } from '@/components/ui/chart'
import { DriverDisplay } from '@/components/DriverDisplay'

interface NostradouglasPrediction {
  id: string
  track_id: string
  track_name: string
  position: number
}

interface CommunityPrediction {
  id: string
  schedule_id: string
  division: number
  split: string
  driver_id: string
  driver_name: string
  driver_number: number | null
  driver_first_name: string | null
  driver_last_name: string | null
  week: number
  track_name: string
}

interface UserWithPredictions {
  user_id: string
  display_name: string
  created_at: string
  nostradouglas_predictions: NostradouglasPrediction[]
  community_predictions: CommunityPrediction[]
  nostradouglas_count: number
  community_count: number
}



// Helper function to calculate chart data with totals and percentages
const calculateChartDataWithStats = (data: ChartData[]): ChartData[] => {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  return data.map(item => ({
    ...item,
    name: `${item.name} (${item.value}, ${((item.value / total) * 100).toFixed(1)}%)`
  }))
}

export function AdminDashboard() {
  const { user, isAdmin } = useAuth()
  const [users, setUsers] = useState<UserWithPredictions[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [weeklyTrackData, setWeeklyTrackData] = useState<Array<{week: number, data: ChartData[], config: ChartConfig}>>([]);
  const [communityData, setCommunityData] = useState<CommunityPrediction[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [availableWeeks, setAvailableWeeks] = useState<number[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    usersWithNostradouglas: 0,
    usersWithCommunityPredictions: 0,
    totalNostradouglas: 0,
    totalCommunityPredictions: 0
  })

  const fetchAdminData = async () => {
    if (!user || !isAdmin) return

    try {
      setError(null)
      
      // Fetch all users using admin view
      const { data: usersData, error: usersError } = await supabase
        .from('admin_users_view')
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
          nostradouglas_predictions: [],
          community_predictions: [],
          nostradouglas_count: 0,
          community_count: 0
        })) || [])
        setStats({
          totalUsers: usersData?.length || 0,
          usersWithNostradouglas: 0,
          usersWithCommunityPredictions: 0,
          totalNostradouglas: 0,
          totalCommunityPredictions: 0
        })
        return
      }

      // Fetch Nostradouglas predictions using admin view
      const { data: nostradouglasData, error: nostradouglasError } = await supabase
        .from('admin_nostradouglas_view')
        .select('*')
        .eq('season_id', currentSeason.id)
        .order('position', { ascending: true })

      if (nostradouglasError) throw nostradouglasError

      // Fetch Community predictions using admin view
      const { data: communityPredictionsData, error: communityError } = await supabase
        .from('admin_predictions_view')
        .select('*')
        .eq('season_number', currentSeason.season_number)
        .order('week', { ascending: false })

      if (communityError) {
        console.warn('Community predictions fetch failed:', communityError)
        // Continue without community predictions if they fail
      }

      // Group Nostradouglas predictions by user
      const userNostradouglas = new Map<string, NostradouglasPrediction[]>()
      nostradouglasData?.forEach(prediction => {
        const userId = prediction.user_id
        if (!userNostradouglas.has(userId)) {
          userNostradouglas.set(userId, [])
        }
        userNostradouglas.get(userId)?.push({
          id: prediction.id,
          track_id: prediction.track_id,
          track_name: prediction.track_name || 'Unknown Track',
          position: prediction.position
        })
      })
      
      // Store community predictions and calculate available weeks
      const allCommunityPredictions: CommunityPrediction[] = []
      const weekSet = new Set<number>()
      
      // Group Community predictions by user
      const userCommunity = new Map<string, CommunityPrediction[]>()
      communityPredictionsData?.forEach(prediction => {
        const userId = prediction.user_id
        if (!userCommunity.has(userId)) {
          userCommunity.set(userId, [])
        }
        const communityPrediction: CommunityPrediction = {
          id: prediction.id,
          schedule_id: prediction.schedule_id,
          division: prediction.division,
          split: prediction.split,
          driver_id: prediction.driver_id,
          driver_name: prediction.driver_name || 'Unknown Driver',
          driver_number: prediction.driver_number,
          driver_first_name: prediction.driver_first_name,
          driver_last_name: prediction.driver_last_name,
          week: prediction.week || 0,
          track_name: prediction.track_name || 'Unknown Track'
        }
        
        userCommunity.get(userId)?.push(communityPrediction)
        allCommunityPredictions.push(communityPrediction)
        weekSet.add(prediction.week || 0)
      })

      // Combine users with their predictions
      const usersWithPredictions = usersData?.map(user => ({
        ...user,
        user_id: user.id, // Add user_id for compatibility
        nostradouglas_predictions: userNostradouglas.get(user.id) || [],
        community_predictions: userCommunity.get(user.id) || [],
        nostradouglas_count: userNostradouglas.get(user.id)?.length || 0,
        community_count: userCommunity.get(user.id)?.length || 0
      })) || []

      setUsers(usersWithPredictions)
      setStats({
        totalUsers: usersData?.length || 0,
        usersWithNostradouglas: usersWithPredictions.filter(u => u.nostradouglas_count > 0).length,
        usersWithCommunityPredictions: usersWithPredictions.filter(u => u.community_count > 0).length,
        totalNostradouglas: nostradouglasData?.length || 0,
        totalCommunityPredictions: communityPredictionsData?.length || 0
      })

      // Store community data and set available weeks
      setCommunityData(allCommunityPredictions)
      const weeks = Array.from(weekSet).sort((a, b) => b - a) // Most recent first
      setAvailableWeeks(weeks)
      
      // Set default selected week to most recent week with predictions
      if (weeks.length > 0 && selectedWeek === null) {
        setSelectedWeek(weeks[0])
      }

      // Process data for weekly track charts
      const weeklyData: Array<{week: number, data: ChartData[], config: ChartConfig}> = []
      
      for (let week = 1; week <= 8; week++) {
        const weekPredictions = nostradouglasData?.filter(p => p.position === week) || []
        const trackCounts = new Map<string, number>()
        
        weekPredictions.forEach(prediction => {
          const trackName = prediction.track_name
          trackCounts.set(trackName, (trackCounts.get(trackName) || 0) + 1)
        })
        
        const baseChartData: ChartData[] = Array.from(trackCounts.entries())
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
        
        const chartData = calculateChartDataWithStats(baseChartData)
        
        // Create config for this week's chart
        const config: ChartConfig = {}
        chartData.forEach((item) => {
          config[item.name] = {
            label: item.name,
          }
        })
        
        weeklyData.push({ week, data: chartData, config })
      }
      
      setWeeklyTrackData(weeklyData)

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
      <div className="grid gap-4 md:grid-cols-5 mb-6">
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
            <CardTitle className="text-sm font-medium">Nostradouglas Users</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.usersWithNostradouglas}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalUsers > 0 ? Math.round((stats.usersWithNostradouglas / stats.totalUsers) * 100) : 0}% participation
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Community Prediction Users</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.usersWithCommunityPredictions}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalUsers > 0 ? Math.round((stats.usersWithCommunityPredictions / stats.totalUsers) * 100) : 0}% participation
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Track Predictions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalNostradouglas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Race Winner Predictions</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCommunityPredictions}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="nostradouglas">Nostradouglas</TabsTrigger>
          <TabsTrigger value="community">Community Predictions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                All registered users and their participation in both prediction games
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
                      <Badge variant={user.nostradouglas_count > 0 ? "default" : "secondary"}>
                        Nostradouglas: {user.nostradouglas_count}/8
                      </Badge>
                      <Badge variant={user.community_count > 0 ? "default" : "secondary"}>
                        Community Predictions: {user.community_count}
                      </Badge>
                      {user.nostradouglas_count === 8 && (
                        <Badge variant="outline" className="text-green-600">
                          Nostradouglas Complete
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nostradouglas" className="space-y-4">
          {/* Weekly Track Distribution Charts */}
          <Card>
            <CardHeader>
              <CardTitle>Track Predictions by Week</CardTitle>
              <CardDescription>
                Distribution of track predictions for each week position
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {weeklyTrackData.map(({ week, data, config }) => (
                  <div key={week} className="space-y-4">
                    <h4 className="text-sm font-medium text-center">Week {week}</h4>
                    {data.length > 0 ? (
                      <div className="h-64">
                        <PieChartComponent
                          data={data}
                          config={config}
                          className="h-full"
                        />
                      </div>
                    ) : (
                      <div className="h-64 flex items-center justify-center text-muted-foreground">
                        <p className="text-sm">No predictions</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Individual User Predictions */}
          <Card>
            <CardHeader>
              <CardTitle>Nostradouglas Predictions</CardTitle>
              <CardDescription>
                Track order predictions by user (predict which 8 tracks will be raced and in what order)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {users
                  .filter(user => user.nostradouglas_count > 0)
                  .map((user) => (
                    <div key={user.user_id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">{user.display_name}</h3>
                        <Badge variant={user.nostradouglas_count === 8 ? "default" : "secondary"}>
                          {user.nostradouglas_count}/8 tracks
                        </Badge>
                      </div>
                      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                        {user.nostradouglas_predictions
                          .sort((a, b) => a.position - b.position)
                          .map((prediction) => (
                            <div 
                              key={prediction.id}
                              className="flex items-center justify-between p-2 bg-muted rounded"
                            >
                              <span className="text-sm font-medium">
                                Week #{prediction.position}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {prediction.track_name}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                
                {users.filter(user => user.nostradouglas_count > 0).length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No Nostradouglas predictions have been made yet.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="community" className="space-y-4">
          {/* Week Selector and Division/Split Charts */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Community Predictions Overview</CardTitle>
                  <CardDescription>
                    Driver predictions by Division and Split for each week
                  </CardDescription>
                </div>
                <div className="w-48">
                  <Select
                    value={selectedWeek?.toString() || ""}
                    onValueChange={(value) => setSelectedWeek(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select week..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableWeeks.map((week) => (
                        <SelectItem key={week} value={week.toString()}>
                          Week {week}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            {selectedWeek && (
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map(division => 
                    ['Gold', 'Silver'].map(split => {
                      const divisionSplitPredictions = communityData.filter(p => 
                        p.week === selectedWeek && 
                        p.division === division && 
                        p.split === split
                      )
                      
                      const driverCounts = new Map<string, number>()
                      divisionSplitPredictions.forEach(prediction => {
                        const driverName = `${prediction.driver_number ? `#${prediction.driver_number} ` : ''}${prediction.driver_first_name || ''} ${prediction.driver_last_name || ''}`.trim() || prediction.driver_name || 'Unknown Driver'
                        driverCounts.set(driverName, (driverCounts.get(driverName) || 0) + 1)
                      })
                      
                      const baseChartData: ChartData[] = Array.from(driverCounts.entries())
                        .map(([name, value]) => ({ name, value }))
                        .sort((a, b) => b.value - a.value)
                      
                      const chartData = calculateChartDataWithStats(baseChartData)
                      
                      const config: ChartConfig = {}
                      chartData.forEach((item) => {
                        config[item.name] = { label: item.name }
                      })

                      return (
                        <div key={`${division}-${split}`} className="space-y-4">
                          <h4 className="text-sm font-medium text-center">
                            Division {division} - {split}
                          </h4>
                          {chartData.length > 0 ? (
                            <div className="h-64">
                              <PieChartComponent
                                data={chartData}
                                config={config}
                                className="h-full"
                              />
                            </div>
                          ) : (
                            <div className="h-64 flex items-center justify-center text-muted-foreground">
                              <p className="text-sm">No predictions</p>
                            </div>
                          )}
                        </div>
                      )
                    })
                  ).flat()}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Individual User Predictions */}
          <Card>
            <CardHeader>
              <CardTitle>Individual User Predictions</CardTitle>
              <CardDescription>
                Race winner predictions by user (predict who will win each race)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {users
                  .filter(user => user.community_count > 0)
                  .map((user) => (
                    <div key={user.user_id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">{user.display_name}</h3>
                        <Badge variant="default">
                          {user.community_count} race predictions
                        </Badge>
                      </div>
                      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                        {user.community_predictions
                          .sort((a, b) => a.week - b.week)
                          .map((prediction) => (
                            <div 
                              key={prediction.id}
                              className="p-3 bg-muted rounded"
                            >
                              <div className="text-sm font-medium mb-1">
                                Week {prediction.week} - {prediction.track_name}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>Div {prediction.division} {prediction.split}:</span>
                                <DriverDisplay 
                                  driver={{
                                    division: prediction.division,
                                    division_split: prediction.split as 'Gold' | 'Silver',
                                    driver_number: prediction.driver_number,
                                    first_name: prediction.driver_first_name,
                                    last_name: prediction.driver_last_name
                                  }}
                                  imageSize="sm"
                                />
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                
                {users.filter(user => user.community_count > 0).length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No community predictions have been made yet.
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