import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Eye, Grid3X3, Lock, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface UserPredictions {
  userId: string
  displayName: string
  podiumPicks: {
    classId: string
    className: string
    picks: { position: number; carNumber: string; teamName: string }[]
  }[]
  manufacturerRanks: {
    classId: string
    className: string
    ranks: { rank: number; manufacturerName: string }[]
  }[]
}

interface ImsaClass {
  id: string
  name: string
  display_order: number
  has_manufacturer_prediction: boolean
}

interface ImsaEvent {
  id: string
  name: string
  year: number
  prediction_deadline: string
}

export default function ImsaCommunityPicks() {
  const [event, setEvent] = useState<ImsaEvent | null>(null)
  const [isLocked, setIsLocked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userPredictions, setUserPredictions] = useState<UserPredictions[]>([])
  const [classes, setClasses] = useState<ImsaClass[]>([])
  const [viewMode, setViewMode] = useState<'by-user' | 'by-position'>('by-user')
  const [selectedClassId, setSelectedClassId] = useState<string>('all')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      // Get active event
      const { data: eventData } = await supabase
        .from('imsa_events')
        .select('*')
        .eq('is_active', true)
        .single()

      if (!eventData) {
        setLoading(false)
        return
      }

      setEvent(eventData)
      const deadline = new Date(eventData.prediction_deadline)
      const now = new Date()
      setIsLocked(now >= deadline)

      if (now < deadline) {
        setLoading(false)
        return
      }

      // Fetch classes
      const { data: classData } = await supabase
        .from('imsa_classes')
        .select('*')
        .eq('event_id', eventData.id)
        .order('display_order')

      setClasses(classData || [])

      // Fetch all podium predictions with entry info
      const { data: podiumData } = await supabase
        .from('imsa_podium_predictions')
        .select(`
          user_id,
          class_id,
          position,
          entry:imsa_entries(car_number, team_name)
        `)
        .eq('event_id', eventData.id)

      // Fetch all manufacturer predictions with manufacturer info
      const { data: mfrData } = await supabase
        .from('imsa_manufacturer_predictions')
        .select(`
          user_id,
          class_id,
          predicted_rank,
          manufacturer:imsa_manufacturers(name)
        `)
        .eq('event_id', eventData.id)

      // Get unique user IDs
      const userIds = [...new Set([
        ...(podiumData || []).map((p: { user_id: string }) => p.user_id),
        ...(mfrData || []).map((p: { user_id: string }) => p.user_id)
      ])]

      // Fetch user display names from user_profiles_public
      const { data: profileData } = await supabase
        .from('user_profiles_public')
        .select('user_id, display_name')
        .in('user_id', userIds)

      const userMap = new Map<string, string>()
      ;(profileData || []).forEach(p => {
        userMap.set(p.user_id, p.display_name || 'Unknown')
      })
      // Add fallback for users without profiles
      userIds.forEach(id => {
        if (!userMap.has(id)) {
          userMap.set(id, 'Unknown User')
        }
      })

      // Build user predictions structure
      const predictions: UserPredictions[] = userIds.map(userId => {
        const userPodium = (podiumData || []).filter((p: Record<string, unknown>) => p.user_id === userId)
        const userMfr = (mfrData || []).filter((p: Record<string, unknown>) => p.user_id === userId)

        const podiumByClass = (classData || []).map(cls => ({
          classId: cls.id,
          className: cls.name,
          picks: userPodium
            .filter((p: Record<string, unknown>) => p.class_id === cls.id)
            .sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
              (a.position as number) - (b.position as number)
            )
            .map((p: Record<string, unknown>) => {
              const entry = p.entry as { car_number: string; team_name: string } | null
              return {
                position: p.position as number,
                carNumber: entry?.car_number || '?',
                teamName: entry?.team_name || 'Unknown'
              }
            })
        }))

        const mfrByClass = (classData || [])
          .filter(cls => cls.has_manufacturer_prediction)
          .map(cls => ({
            classId: cls.id,
            className: cls.name,
            ranks: userMfr
              .filter((p: Record<string, unknown>) => p.class_id === cls.id)
              .sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
                (a.predicted_rank as number) - (b.predicted_rank as number)
              )
              .map((p: Record<string, unknown>) => {
                const manufacturer = p.manufacturer as { name: string } | null
                return {
                  rank: p.predicted_rank as number,
                  manufacturerName: manufacturer?.name || 'Unknown'
                }
              })
          }))

        return {
          userId,
          displayName: userMap.get(userId) || 'Unknown',
          podiumPicks: podiumByClass,
          manufacturerRanks: mfrByClass
        }
      })

      // Sort by display name
      predictions.sort((a, b) => a.displayName.localeCompare(b.displayName))

      setUserPredictions(predictions)
      setLoading(false)
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading community picks..." center />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No active event found.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!isLocked) {
    const deadline = new Date(event.prediction_deadline)
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <Lock className="h-16 w-16 text-muted-foreground" />
                </div>
                <CardTitle className="text-2xl">Predictions Hidden</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Community picks will be revealed after the prediction deadline.
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-3 bg-secondary rounded-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div className="text-left">
                    <p className="text-sm text-muted-foreground">Deadline</p>
                    <p className="font-semibold">
                      {deadline.toLocaleDateString()} at {deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Make sure to submit your predictions before then!
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Users className="h-6 w-6" />
              Community Picks
            </h1>
            <p className="text-muted-foreground">
              {event.name} ({event.year}) &bull; {userPredictions.length} participant{userPredictions.length !== 1 && 's'}
            </p>
          </div>

          <div className="flex gap-2">
            <Select value={viewMode} onValueChange={(v: 'by-user' | 'by-position') => setViewMode(v)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="by-user">
                  <span className="flex items-center gap-2">
                    <Eye className="h-4 w-4" /> By User
                  </span>
                </SelectItem>
                <SelectItem value="by-position">
                  <span className="flex items-center gap-2">
                    <Grid3X3 className="h-4 w-4" /> By Position
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map(cls => (
                  <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Content */}
        {viewMode === 'by-user' ? (
          <ByUserView
            predictions={userPredictions}
            selectedClassId={selectedClassId}
          />
        ) : (
          <ByPositionView
            predictions={userPredictions}
            selectedClassId={selectedClassId}
            classes={classes}
          />
        )}
      </div>
    </div>
  )
}

interface ByUserViewProps {
  predictions: UserPredictions[]
  selectedClassId: string
}

function ByUserView({ predictions, selectedClassId }: ByUserViewProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {predictions.map((user, idx) => (
        <motion.div
          key={user.userId}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.03 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{user.displayName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {user.podiumPicks
                .filter(cls => selectedClassId === 'all' || cls.classId === selectedClassId)
                .map(cls => (
                  <div key={cls.classId}>
                    <p className="font-semibold text-sm text-muted-foreground mb-1">{cls.className} Podium</p>
                    {cls.picks.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No picks</p>
                    ) : (
                      <div className="space-y-0.5">
                        {cls.picks.map(pick => (
                          <div key={pick.position} className="flex items-center gap-2 text-sm">
                            <span className="w-6 text-center">
                              {pick.position === 1 && '1st'}
                              {pick.position === 2 && '2nd'}
                              {pick.position === 3 && '3rd'}
                            </span>
                            <span className="font-mono font-semibold">#{pick.carNumber}</span>
                            <span className="text-muted-foreground truncate text-xs">{pick.teamName}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

              {user.manufacturerRanks
                .filter(cls => selectedClassId === 'all' || cls.classId === selectedClassId)
                .map(cls => (
                  <div key={`mfr-${cls.classId}`}>
                    <p className="font-semibold text-sm text-muted-foreground mb-1">{cls.className} Manufacturers</p>
                    {cls.ranks.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No ranking</p>
                    ) : (
                      <p className="text-sm">
                        {cls.ranks.map(r => r.manufacturerName).join(' → ')}
                      </p>
                    )}
                  </div>
                ))}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

interface ByPositionViewProps {
  predictions: UserPredictions[]
  selectedClassId: string
  classes: ImsaClass[]
}

function ByPositionView({ predictions, selectedClassId, classes }: ByPositionViewProps) {
  const filteredClasses = classes.filter(
    cls => selectedClassId === 'all' || cls.id === selectedClassId
  )

  // Build position aggregation
  // classId -> position -> carNumber -> userNames[]
  const podiumAgg: Record<string, Record<number, Record<string, string[]>>> = {}

  // classId -> rank -> mfrName -> userNames[]
  const mfrAgg: Record<string, Record<number, Record<string, string[]>>> = {}

  predictions.forEach(user => {
    user.podiumPicks.forEach(cls => {
      if (!podiumAgg[cls.classId]) podiumAgg[cls.classId] = { 1: {}, 2: {}, 3: {} }
      cls.picks.forEach(pick => {
        const key = `#${pick.carNumber}`
        if (!podiumAgg[cls.classId][pick.position][key]) {
          podiumAgg[cls.classId][pick.position][key] = []
        }
        podiumAgg[cls.classId][pick.position][key].push(user.displayName)
      })
    })

    user.manufacturerRanks.forEach(cls => {
      if (!mfrAgg[cls.classId]) mfrAgg[cls.classId] = {}
      cls.ranks.forEach(r => {
        if (!mfrAgg[cls.classId][r.rank]) mfrAgg[cls.classId][r.rank] = {}
        if (!mfrAgg[cls.classId][r.rank][r.manufacturerName]) {
          mfrAgg[cls.classId][r.rank][r.manufacturerName] = []
        }
        mfrAgg[cls.classId][r.rank][r.manufacturerName].push(user.displayName)
      })
    })
  })

  const posLabels: Record<number, string> = { 1: '1st Place', 2: '2nd Place', 3: '3rd Place' }
  const posBg: Record<number, string> = {
    1: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    2: 'bg-gray-100 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700',
    3: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
  }

  return (
    <div className="space-y-6">
      {filteredClasses.map((cls, idx) => (
        <motion.div
          key={cls.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>{cls.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Podium picks */}
              <div>
                <h4 className="font-semibold mb-3">Podium Predictions</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  {[1, 2, 3].map(position => {
                    const picks = podiumAgg[cls.id]?.[position] || {}
                    const sorted = Object.entries(picks).sort((a, b) => b[1].length - a[1].length)

                    return (
                      <div key={position} className={`rounded-lg p-3 border ${posBg[position]}`}>
                        <p className="font-semibold mb-2">{posLabels[position]}</p>
                        {sorted.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No picks</p>
                        ) : (
                          <div className="space-y-2">
                            {sorted.map(([carNum, users]) => (
                              <div key={carNum}>
                                <div className="flex justify-between items-center">
                                  <span className="font-mono font-semibold">{carNum}</span>
                                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                    {users.length} pick{users.length !== 1 && 's'}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {users.join(', ')}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Manufacturer rankings */}
              {cls.has_manufacturer_prediction && (
                <div>
                  <h4 className="font-semibold mb-3">Manufacturer Rankings - #1 Picks</h4>
                  {(() => {
                    const rank1 = mfrAgg[cls.id]?.[1] || {}
                    const sorted = Object.entries(rank1).sort((a, b) => b[1].length - a[1].length)

                    return sorted.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No rankings</p>
                    ) : (
                      <div className="space-y-2">
                        {sorted.map(([mfrName, users]) => (
                          <div key={mfrName} className="flex items-center gap-4 bg-secondary/50 rounded-lg p-2">
                            <span className="font-semibold w-24">{mfrName}</span>
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                              {users.length} pick{users.length !== 1 && 's'}
                            </span>
                            <span className="text-xs text-muted-foreground flex-1">
                              {users.join(', ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
