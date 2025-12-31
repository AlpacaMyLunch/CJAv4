import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { PieChartComponent, type ChartData, type ChartConfig } from '@/components/ui/chart'
import { DivisionSplitLabel } from '@/components/DivisionSplitLabel'
import { DriverDisplay } from '@/components/DriverDisplay'
import { formatDriverName } from '@/utils/formatting'
import { DIVISIONS, SPLITS } from '@/constants'
import type { UserWithPredictions } from './UsersTab'

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

interface CommunityPredictionsTabProps {
  users: UserWithPredictions[]
  communityData: CommunityPrediction[]
  selectedWeek: number | null
  setSelectedWeek: (week: number) => void
  availableWeeks: number[]
  calculateChartDataWithStats: (data: ChartData[]) => ChartData[]
}

export function CommunityPredictionsTab({
  users,
  communityData,
  selectedWeek,
  setSelectedWeek,
  availableWeeks,
  calculateChartDataWithStats
}: CommunityPredictionsTabProps) {
  return (
    <>
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
              {DIVISIONS.map(division =>
                SPLITS.map(split => {
                  const divisionSplitPredictions = communityData.filter(p =>
                    p.week === selectedWeek &&
                    p.division === division &&
                    p.split === split
                  )

                  const driverCounts = new Map<string, number>()
                  divisionSplitPredictions.forEach(prediction => {
                    const driverName = formatDriverName({
                      first_name: prediction.driver_first_name,
                      last_name: prediction.driver_last_name,
                      driver_number: prediction.driver_number
                    })
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
                      <div className="flex justify-center">
                        <DivisionSplitLabel
                          division={division}
                          split={split as 'Gold' | 'Silver'}
                          imageSize="sm"
                          textSize="sm"
                        />
                      </div>
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
                            <DivisionSplitLabel
                              division={prediction.division}
                              split={prediction.split as 'Gold' | 'Silver'}
                              imageSize="xs"
                              textSize="sm"
                              showText={false}
                            />

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
    </>
  )
}
