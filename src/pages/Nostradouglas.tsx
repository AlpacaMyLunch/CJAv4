import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useSeasonData } from '@/hooks/useSeasonData'
import { usePredictions } from '@/hooks/usePredictions'
import { useToast } from '@/hooks/useToast'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  DndContext, 
  DragOverlay, 
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent
} from '@dnd-kit/core'
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { 
  Clock, 
  Save, 
  RotateCcw,
  X,
  Loader2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { type Track } from '@/lib/supabase'
import { trackPrediction, trackUserAction } from '@/utils/analytics'

interface PredictionTrack extends Track {
  position: number
}

function PlaceholderTrackCard() {
  return (
    <Card className="group transition-all duration-200 bg-muted/30 border-dashed">
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-sm font-medium">
              1
            </div>
          </div>

          <div className="flex items-center space-x-3 flex-1">
            <div className="text-xl opacity-50">🏁</div>
            <div className="flex-1">
              <h3 className="font-medium text-muted-foreground">Week 1 - Locked</h3>
              <p className="text-xs text-muted-foreground">Deadline has passed</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex-shrink-0 text-muted-foreground text-xs font-medium">
              Locked
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SortableTrackCard({ track, position, onRemove, isLocked }: {
  track: Track,
  position: number,
  onRemove?: (trackId: string) => void,
  isLocked?: boolean
}) {
  const { isAuthenticated } = useAuth()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: track.id, disabled: isLocked })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      className={isAuthenticated && !isLocked ? "touch-none" : ""}
    >
      <Card className={`group transition-all duration-200 ${
        isLocked ? 'bg-muted/50 opacity-90' : ''
      } ${
        isAuthenticated && !isLocked ? 'hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5' : ''
      }`}>
        <CardContent className="p-4">
          <div
            className="flex items-center space-x-4"
            {...(isAuthenticated && !isLocked ? attributes : {})}
            {...(isAuthenticated && !isLocked ? listeners : {})}
          >
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium group-hover:bg-accent transition-colors duration-200">
                {position}
              </div>
            </div>
            
            <div className="flex items-center space-x-3 flex-1">
              <div className="text-xl">🏁</div>
              <div className="flex-1">
                <h3 className="font-medium group-hover:text-primary transition-colors duration-200">{track.name}</h3>
                {/* <p className="text-sm text-muted-foreground group-hover:text-foreground/70 transition-colors duration-200">Racing Circuit</p> */}
              </div>
            </div>

            <div className="flex items-center space-x-2" style={{ pointerEvents: 'none' }}>
              {isAuthenticated && onRemove && !isLocked && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    onRemove(track.id)
                  }}
                  onPointerDown={(e) => {
                    e.stopPropagation()
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation()
                  }}
                  className="w-6 h-6 rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive flex items-center justify-center transition-colors z-10 relative"
                  title="Remove track"
                  style={{ pointerEvents: 'auto', touchAction: 'none' }}
                >
                  <X className="w-3 h-3" />
                </button>
              )}

              {isAuthenticated && !isLocked && (
                <div className="flex-shrink-0 text-muted-foreground cursor-move" style={{ pointerEvents: 'auto' }} title="Drag to reorder">
                  <svg width="20" height="20" viewBox="0 0 20 20" className="fill-current">
                    <circle cx="5" cy="7" r="1" />
                    <circle cx="5" cy="10" r="1" />
                    <circle cx="5" cy="13" r="1" />
                    <circle cx="15" cy="7" r="1" />
                    <circle cx="15" cy="10" r="1" />
                    <circle cx="15" cy="13" r="1" />
                  </svg>
                </div>
              )}

              {isLocked && (
                <div className="flex-shrink-0 text-muted-foreground text-xs font-medium">
                  Locked
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function TrackSelectionCard({ track, onSelect, isSelected }: { 
  track: Track, 
  onSelect: (track: Track) => void,
  isSelected: boolean 
}) {
  const { isAuthenticated } = useAuth()
  
  return (
    <Card 
      className={`group cursor-pointer transition-all duration-200 ${
        isSelected 
          ? 'ring-2 ring-primary bg-primary/5 opacity-50' 
          : isAuthenticated
          ? 'hover:shadow-lg hover:shadow-primary/5 hover:ring-1 hover:ring-primary/20 hover:bg-card/80 hover:-translate-y-0.5'
          : 'hover:shadow-md hover:-translate-y-0.5'
      } ${!isAuthenticated && !isSelected ? 'cursor-default' : ''}`}
      onClick={() => !isSelected && isAuthenticated && onSelect(track)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">🏁</div>
            <div>
              <h4 className="font-medium text-sm group-hover:text-primary transition-colors duration-200">{track.name}</h4>
              {/* <p className="text-xs text-muted-foreground group-hover:text-foreground/70 transition-colors duration-200">Racing Circuit</p> */}
            </div>
          </div>
          {isSelected && (
            <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function Nostradouglas() {
  const { user, isAuthenticated, signInWithDiscord } = useAuth()
  const { season, tracks, loading: seasonLoading, error: seasonError } = useSeasonData()
  const { predictions, error: predictionsError, savePredictions } = usePredictions(season?.id || null)
  const { addToast } = useToast()
  
  const [selectedTracks, setSelectedTracks] = useState<PredictionTrack[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [hasBeenReset, setHasBeenReset] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Load existing predictions when data is available
  useEffect(() => {
    if (predictions.length > 0 && tracks.length > 0) {
      const predictionTracks: PredictionTrack[] = predictions.map(prediction => {
        const track = tracks.find(t => t.id === prediction.track_id)
        return {
          id: track?.id || prediction.track_id,
          name: track?.name || 'Unknown Track',
          position: prediction.position
        }
      }).sort((a, b) => a.position - b.position)
      
      setSelectedTracks(predictionTracks)
    } else if (predictions.length === 0) {
      // Clear selected tracks if we have no predictions (covers both signed out and signed in with no predictions)
      setSelectedTracks([])
    }
  }, [predictions, tracks, user, season?.id])

  const deadline = season ? new Date(season.prediction_deadline) : new Date()
  const week1Deadline = season?.week_1_prediction_deadline ? new Date(season.week_1_prediction_deadline) : null
  const isDeadlinePassed = new Date() > deadline
  const isWeek1DeadlinePassed = week1Deadline ? new Date() > week1Deadline : false
  const timeToDeadline = deadline.getTime() - new Date().getTime()
  const daysLeft = Math.max(0, Math.floor(timeToDeadline / (1000 * 60 * 60 * 24)))
  const hoursLeft = Math.max(0, Math.floor((timeToDeadline % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)))

  const timeToWeek1Deadline = week1Deadline ? week1Deadline.getTime() - new Date().getTime() : 0
  const week1DaysLeft = Math.max(0, Math.floor(timeToWeek1Deadline / (1000 * 60 * 60 * 24)))
  const week1HoursLeft = Math.max(0, Math.floor((timeToWeek1Deadline % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)))

  // Create placeholder for week 1 if deadline passed and user has no saved predictions in database
  // Check if user has a saved week 1 prediction in the database (and hasn't reset)
  const hasSavedWeek1Prediction = !hasBeenReset && predictions.some(p => p.position === 1)
  const shouldShowWeek1Placeholder = isWeek1DeadlinePassed && !hasSavedWeek1Prediction && selectedTracks.length > 0

  const handleTrackSelect = (track: Track) => {
    // Calculate max tracks: 8 normally, or 7 if week 1 deadline passed and no saved week 1 prediction
    const maxTracks = (isWeek1DeadlinePassed && !hasSavedWeek1Prediction) ? 7 : 8

    if (selectedTracks.length < maxTracks && !isDeadlinePassed && isAuthenticated) {
      // If week 1 deadline has passed and user has no saved week 1 prediction, start at position 2
      const startPosition = (isWeek1DeadlinePassed && !hasSavedWeek1Prediction) ? 2 : 1
      const newPosition = startPosition + selectedTracks.length

      const newTrack: PredictionTrack = {
        ...track,
        position: newPosition
      }
      setSelectedTracks([...selectedTracks, newTrack])

      // Track track selection
      trackUserAction('track_selected', {
        track_name: track.name,
        position: newPosition,
        total_selected: selectedTracks.length + 1
      })
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (over && active.id !== over.id && isAuthenticated) {
      const oldIndex = selectedTracks.findIndex(track => track.id === active.id)
      const newIndex = selectedTracks.findIndex(track => track.id === over.id)

      // Check if week 1 deadline has passed and the reorder would affect position 1
      if (isWeek1DeadlinePassed && hasSavedWeek1Prediction) {
        // Prevent any drag that involves index 0 (position 1)
        if (oldIndex === 0 || newIndex === 0) {
          addToast({
            title: 'Week 1 Locked',
            description: 'The deadline for week 1 predictions has passed. You cannot change your week 1 prediction.',
            variant: 'destructive'
          })
          return
        }
      }

      const newTracks = arrayMove(selectedTracks, oldIndex, newIndex).map((track, index) => ({
        ...track,
        position: index + 1
      }))

      setSelectedTracks(newTracks)
    }
  }

  const removeTrack = (trackId: string) => {
    if (!isDeadlinePassed && isAuthenticated) {
      const trackToRemove = selectedTracks.find(track => track.id === trackId)

      // Check if week 1 deadline has passed and trying to remove position 1
      if (isWeek1DeadlinePassed && hasSavedWeek1Prediction && trackToRemove?.position === 1) {
        addToast({
          title: 'Week 1 Locked',
          description: 'The deadline for week 1 predictions has passed. You cannot remove your week 1 prediction.',
          variant: 'destructive'
        })
        return
      }

      // Track track removal
      if (trackToRemove) {
        trackUserAction('track_removed', {
          track_name: trackToRemove.name,
          position: trackToRemove.position,
          total_selected: selectedTracks.length - 1
        })
      }

      const newTracks = selectedTracks
        .filter(track => track.id !== trackId)
        .map((track, index) => ({
          ...track,
          position: index + 1
        }))
      setSelectedTracks(newTracks)
    }
  }

  const resetPrediction = () => {
    if (!isDeadlinePassed && isAuthenticated) {
      // Track prediction reset
      trackPrediction('clear', { track_count: selectedTracks.length })

      setSelectedTracks([])
      setHasBeenReset(true)
    }
  }

  const savePrediction = async () => {
    if (!isAuthenticated) {
      addToast({
        title: 'Authentication Required',
        description: 'Please sign in to save your prediction!',
        variant: 'destructive'
      })
      return
    }

    const requiredTracks = (isWeek1DeadlinePassed && !hasSavedWeek1Prediction) ? 7 : 8
    if (selectedTracks.length !== requiredTracks) {
      addToast({
        title: 'Incomplete Selection',
        description: `Please select exactly ${requiredTracks} tracks before saving.`,
        variant: 'destructive'
      })
      return
    }

    try {
      setSaving(true)
      const trackPredictions = selectedTracks.map(track => ({
        trackId: track.id,
        position: track.position
      }))
      
      await savePredictions(trackPredictions)

      // Reset the hasBeenReset flag since we've now saved
      setHasBeenReset(false)

      // Track prediction save
      trackPrediction('save', { track_count: selectedTracks.length })

      addToast({
        title: 'Success!',
        description: 'Your prediction has been saved successfully.',
        variant: 'success'
      })
    } catch (error) {
      console.error('Failed to save prediction:', error)
      addToast({
        title: 'Save Failed',
        description: 'Failed to save prediction. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  if (seasonLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading season data...</span>
        </div>
      </div>
    )
  }

  if (seasonError || !season) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-destructive mb-4">Error Loading Season</h1>
          <p className="text-muted-foreground">{seasonError || 'Season not found'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Track Predictions for Season {season.season_number}</h1>
            <p className="text-muted-foreground mt-1">
              Select and order 8 tracks for the upcoming season
            </p>
          </div>
          
          {!isDeadlinePassed ? (
            <div className="text-right space-y-2">
              {week1Deadline && (
                <div>
                  {!isWeek1DeadlinePassed ? (
                    <>
                      <div className="flex items-center justify-end gap-2 text-sm font-medium text-orange-600 dark:text-orange-400">
                        <Clock className="h-4 w-4" />
                        <span>Week 1: {week1DaysLeft}d {week1HoursLeft}h</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Week 1 Deadline: {week1Deadline.toLocaleDateString()}
                      </p>
                    </>
                  ) : (
                    <div className="px-3 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200 rounded-full text-sm font-medium inline-block">
                      Week 1 Locked
                    </div>
                  )}
                </div>
              )}
              {isAuthenticated ? (
                <>
                  <div className="flex items-center justify-end gap-2 text-sm font-medium">
                    <Clock className="h-4 w-4" />
                    <span>{daysLeft}d {hoursLeft}h remaining</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Full Deadline: {deadline.toLocaleDateString()}
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-end gap-2 text-sm font-medium">
                    <Clock className="h-4 w-4" />
                    <span>{daysLeft}d {hoursLeft}h remaining</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <button onClick={() => signInWithDiscord(window.location.href)} className="text-primary underline hover:text-primary/80">
                      Sign in
                    </button> to make predictions
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200 rounded-full text-sm font-medium">
              {isAuthenticated ? 'Predictions Locked' : 'Sign in to View Predictions'}
            </div>
          )}
        </div>
      </div>

      {predictionsError && (
        <div className="mb-4 p-4 bg-destructive/10 text-destructive rounded-lg">
          Error loading predictions: {predictionsError}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Available Tracks */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Available Tracks</CardTitle>
              <CardDescription>
                {isAuthenticated ? (
                  `Click to add tracks to your prediction`
                ) : (
                  <>
                    View the tracks. <button onClick={() => signInWithDiscord(window.location.href)} className="text-primary underline hover:text-primary/80">Sign in</button> to make predictions.
                  </>
                )}
              </CardDescription>
              {isAuthenticated && (
                <div className="mt-2">
                  {(() => {
                    const maxTracks = (isWeek1DeadlinePassed && !hasSavedWeek1Prediction) ? 7 : 8
                    const isComplete = selectedTracks.length === maxTracks
                    return (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        isComplete
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-primary/10 text-primary'
                      }`}>
                        {selectedTracks.length}/{maxTracks} tracks selected
                        {isWeek1DeadlinePassed && !hasSavedWeek1Prediction && ' (Week 1 locked)'}
                      </span>
                    )
                  })()}
                </div>
              )}
            </CardHeader>
            <CardContent className="max-h-96 overflow-y-auto space-y-2">
              {tracks.map((track) => {
                const isSelected = selectedTracks.some(selected => selected.id === track.id)
                return (
                  <TrackSelectionCard
                    key={track.id}
                    track={track}
                    onSelect={handleTrackSelect}
                    isSelected={isSelected}
                  />
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* Your Prediction */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3">
                    Your Prediction
                    {isAuthenticated && (() => {
                      const maxTracks = (isWeek1DeadlinePassed && !hasSavedWeek1Prediction) ? 7 : 8
                      const isComplete = selectedTracks.length === maxTracks
                      return (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          isComplete
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-primary/10 text-primary'
                        }`}>
                          {selectedTracks.length}/{maxTracks}
                        </span>
                      )
                    })()}
                  </CardTitle>
                  <CardDescription>
                    {isAuthenticated 
                      ? 'Drag to reorder your selected tracks. Click × to remove.'
                      : 'Sign in to make predictions and save your choices.'
                    }
                  </CardDescription>
                </div>
                
                {!isDeadlinePassed && (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={resetPrediction}
                      disabled={selectedTracks.length === 0 || !isAuthenticated}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Reset
                    </Button>
                    <Button
                      size="sm"
                      onClick={savePrediction}
                      disabled={(() => {
                        const requiredTracks = (isWeek1DeadlinePassed && !hasSavedWeek1Prediction) ? 7 : 8
                        return selectedTracks.length < requiredTracks || !isAuthenticated || saving
                      })()}
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-1" />
                      )}
                      {saving ? 'Saving...' : isAuthenticated ? 'Save' : 'Sign in to Save'}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {selectedTracks.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🏁</div>
                  <h3 className="text-lg font-medium mb-2">No tracks selected</h3>
                  <p className="text-muted-foreground">
                    Start by selecting tracks from the left panel
                  </p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCorners}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext 
                    items={selectedTracks.map(track => track.id)} 
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {shouldShowWeek1Placeholder && <PlaceholderTrackCard />}
                      <AnimatePresence>
                        {selectedTracks.map((track) => (
                          <SortableTrackCard
                            key={track.id}
                            track={track}
                            position={track.position}
                            onRemove={removeTrack}
                            isLocked={isWeek1DeadlinePassed && hasSavedWeek1Prediction && track.position === 1}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </SortableContext>

                  <DragOverlay>
                    {activeId ? (
                      <div className="opacity-90">
                        {(() => {
                          const draggedTrack = selectedTracks.find(t => t.id === activeId)!
                          return (
                            <SortableTrackCard
                              track={draggedTrack}
                              position={draggedTrack.position}
                              onRemove={removeTrack}
                              isLocked={isWeek1DeadlinePassed && hasSavedWeek1Prediction && draggedTrack.position === 1}
                            />
                          )
                        })()}
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              )}
            </CardContent>
          </Card>

          {/* Rules */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>How it Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>• Select exactly 8 tracks from the available list</p>
              <p>• Drag and drop to set the order you think they'll appear in the season</p>
              <p>• Points are awarded based on correct track and position predictions</p>
              <p>• Predictions are locked after the deadline - make sure to save!</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}