import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/utils/date'

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

export interface UserWithPredictions {
  user_id: string
  display_name: string
  created_at: string
  nostradouglas_predictions: NostradouglasPrediction[]
  community_predictions: CommunityPrediction[]
  nostradouglas_count: number
  community_count: number
}

interface UsersTabProps {
  users: UserWithPredictions[]
}

export function UsersTab({ users }: UsersTabProps) {
  return (
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
                    Joined {formatDate(user.created_at)}
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
  )
}
