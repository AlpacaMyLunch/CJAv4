import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RefreshCw } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { type ChartData, type ChartConfig } from '@/components/ui/chart'
import { StatsOverview } from '@/components/admin/StatsOverview'
import { UsersTab, type UserWithPredictions } from '@/components/admin/UsersTab'
import { NostradouglasTab } from '@/components/admin/NostradouglasTab'
import { CommunityPredictionsTab } from '@/components/admin/CommunityPredictionsTab'

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

      // Map id to user_id for consistency
      const mappedUsersData = usersData?.map(user => ({
        ...user,
        user_id: user.id
      }))

      // Fetch current season
      const { data: seasonData, error: seasonError } = await supabase
        .from('seasons')
        .select('*')
        .order('season_number', { ascending: false })
        .limit(1)

      if (seasonError) throw seasonError

      const currentSeason = seasonData?.[0]

      if (!currentSeason) {
        setUsers(mappedUsersData?.map(user => ({
          ...user,
          nostradouglas_predictions: [],
          community_predictions: [],
          nostradouglas_count: 0,
          community_count: 0
        })) || [])
        setStats({
          totalUsers: mappedUsersData?.length || 0,
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
      const usersWithPredictions = mappedUsersData?.map(user => ({
        ...user,
        nostradouglas_predictions: userNostradouglas.get(user.user_id) || [],
        community_predictions: userCommunity.get(user.user_id) || [],
        nostradouglas_count: userNostradouglas.get(user.user_id)?.length || 0,
        community_count: userCommunity.get(user.user_id)?.length || 0
      })) || []

      setUsers(usersWithPredictions)
      setCommunityData(allCommunityPredictions)

      const weeks = Array.from(weekSet).sort((a, b) => b - a)
      setAvailableWeeks(weeks)
      if (weeks.length > 0 && !selectedWeek) {
        setSelectedWeek(weeks[0])
      }

      // Calculate stats
      const nostradouglasUsers = usersWithPredictions.filter(u => u.nostradouglas_count > 0).length
      const communityUsers = usersWithPredictions.filter(u => u.community_count > 0).length
      const totalNostradouglasPredictions = usersWithPredictions.reduce((sum, u) => sum + u.nostradouglas_count, 0)
      const totalCommunityPredictions = usersWithPredictions.reduce((sum, u) => sum + u.community_count, 0)

      setStats({
        totalUsers: usersWithPredictions.length,
        usersWithNostradouglas: nostradouglasUsers,
        usersWithCommunityPredictions: communityUsers,
        totalNostradouglas: totalNostradouglasPredictions,
        totalCommunityPredictions: totalCommunityPredictions
      })

      // Calculate weekly track distribution charts for Nostradouglas
      const weeklyData: Array<{week: number, data: ChartData[], config: ChartConfig}> = []
      for (let week = 1; week <= 8; week++) {
        const trackCounts = new Map<string, number>()

        nostradouglasData?.forEach(prediction => {
          if (prediction.position === week) {
            const trackName = prediction.track_name || 'Unknown Track'
            trackCounts.set(trackName, (trackCounts.get(trackName) || 0) + 1)
          }
        })

        const baseChartData: ChartData[] = Array.from(trackCounts.entries())
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)

        const chartData = calculateChartDataWithStats(baseChartData)

        const config: ChartConfig = {}
        chartData.forEach((item) => {
          config[item.name] = { label: item.name }
        })

        weeklyData.push({
          week,
          data: chartData,
          config
        })
      }

      setWeeklyTrackData(weeklyData)
    } catch (err) {
      console.error('Error fetching admin data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch admin data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdminData()
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
          <LoadingSpinner />
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
      <div className="mb-6">
        <StatsOverview
          totalUsers={stats.totalUsers}
          usersWithNostradouglas={stats.usersWithNostradouglas}
          usersWithCommunityPredictions={stats.usersWithCommunityPredictions}
          totalNostradouglas={stats.totalNostradouglas}
          totalCommunityPredictions={stats.totalCommunityPredictions}
        />
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="nostradouglas">Nostradouglas</TabsTrigger>
          <TabsTrigger value="community">Community Predictions</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <UsersTab users={users} />
        </TabsContent>

        <TabsContent value="nostradouglas" className="space-y-4">
          <NostradouglasTab
            users={users}
            weeklyTrackData={weeklyTrackData}
          />
        </TabsContent>

        <TabsContent value="community" className="space-y-4">
          <CommunityPredictionsTab
            users={users}
            communityData={communityData}
            selectedWeek={selectedWeek}
            setSelectedWeek={setSelectedWeek}
            availableWeeks={availableWeeks}
            calculateChartDataWithStats={calculateChartDataWithStats}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
