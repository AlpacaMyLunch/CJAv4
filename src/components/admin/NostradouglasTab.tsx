import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PieChartComponent, type ChartData, type ChartConfig } from '@/components/ui/chart'
import type { UserWithPredictions } from './UsersTab'

interface NostradouglasTabProps {
  users: UserWithPredictions[]
  weeklyTrackData: Array<{
    week: number
    data: ChartData[]
    config: ChartConfig
  }>
}

export function NostradouglasTab({ users, weeklyTrackData }: NostradouglasTabProps) {
  return (
    <>
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
    </>
  )
}
