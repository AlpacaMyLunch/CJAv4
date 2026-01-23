import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Flag, Clock, AlertCircle, Lock, Trophy } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useImsaEvents } from '@/hooks/useImsaEvents'
import { useImsaEventData } from '@/hooks/useImsaEventData'
import { useImsaPredictions } from '@/hooks/useImsaPredictions'
import {
  EventSelector,
  ClassTabs,
  PodiumPicker,
  ManufacturerRanker
} from '@/components/imsa'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { RequireAuth } from '@/components/RequireAuth'

export function ImsaPredictions() {
  const { user } = useAuth()
  const { events, activeEvent, loading: eventsLoading, error: eventsError } = useImsaEvents()

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)

  // Use active event by default, or user selection
  const effectiveEventId = selectedEventId || activeEvent?.id || null

  const {
    classes,
    loading: eventDataLoading,
    error: eventDataError
  } = useImsaEventData(effectiveEventId)

  const {
    podiumPredictions,
    manufacturerPredictions,
    loading: predictionsLoading,
    saving,
    error: predictionsError,
    savePodiumPredictionsBatch,
    saveManufacturerPredictionsBatch
  } = useImsaPredictions(effectiveEventId, user?.id || null)

  // Auto-select first class when classes load
  useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id)
    }
  }, [classes, selectedClassId])

  // Reset class selection when event changes
  useEffect(() => {
    setSelectedClassId(null)
  }, [effectiveEventId])

  // Get current class data
  const currentClass = useMemo(
    () => classes.find(c => c.id === selectedClassId),
    [classes, selectedClassId]
  )

  // Filter predictions for current class
  const classPodiumPredictions = useMemo(
    () => podiumPredictions.filter(p => p.class_id === selectedClassId),
    [podiumPredictions, selectedClassId]
  )

  const classManufacturerPredictions = useMemo(
    () => manufacturerPredictions.filter(p => p.class_id === selectedClassId),
    [manufacturerPredictions, selectedClassId]
  )

  // Check if predictions are locked (past deadline)
  const selectedEvent = events.find(e => e.id === effectiveEventId)
  const isPastDeadline = selectedEvent
    ? new Date() > new Date(selectedEvent.prediction_deadline)
    : false

  // Loading state
  if (eventsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading events..." center />
      </div>
    )
  }

  // Error state
  const error = eventsError || eventDataError || predictionsError
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Error Loading Data</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  // No events
  if (events.length === 0) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Card>
            <CardContent className="py-12 text-center">
              <Flag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">No Events Available</h2>
              <p className="text-muted-foreground">
                No IMSA events available for predictions yet. Check back soon!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <RequireAuth
      loadingMessage="Loading predictions..."
      title="IMSA Predictions"
      description="Sign in to make your predictions for IMSA race podium finishes and manufacturer rankings!"
      icon={Trophy}
      additionalInfo={
        <p className="text-sm text-muted-foreground">
          Predict the top 3 finishers in each class and rank manufacturers by average finish.
        </p>
      }
    >
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Flag className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">IMSA Predictions</h1>
            </div>
            <p className="text-muted-foreground">
              Predict podium finishers and manufacturer rankings
            </p>
          </motion.div>

          <div className="space-y-6">
            {/* Event Selector */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <EventSelector
                    events={events}
                    selectedEventId={effectiveEventId}
                    onSelectEvent={setSelectedEventId}
                    loading={eventsLoading}
                  />
                </CardContent>
              </Card>
            </motion.div>

            {/* Event Info & Deadline */}
            {selectedEvent && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-semibold text-card-foreground">
                          {selectedEvent.name}
                        </h2>
                        <p className="text-sm text-muted-foreground">{selectedEvent.track}</p>
                      </div>
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
                        isPastDeadline
                          ? 'bg-destructive/10 text-destructive border border-destructive/20'
                          : 'bg-primary/10 text-primary border border-primary/20'
                      }`}>
                        {isPastDeadline ? (
                          <Lock className="h-4 w-4" />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                        <span className="text-sm font-medium">
                          {isPastDeadline
                            ? 'Predictions locked'
                            : `Deadline: ${new Date(selectedEvent.prediction_deadline).toLocaleString()}`
                          }
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Class Tabs & Predictions */}
            {effectiveEventId && classes.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <ClassTabs
                      classes={classes}
                      selectedClassId={selectedClassId}
                      onSelectClass={setSelectedClassId}
                    />
                  </CardHeader>
                  <CardContent>
                    {eventDataLoading || predictionsLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <LoadingSpinner size="md" message="Loading class data..." center />
                      </div>
                    ) : currentClass ? (
                      <div className="space-y-4">
                        {/* Podium Picker */}
                        <div className="bg-muted/30 rounded-lg p-4">
                          <div className="mb-4">
                            <h3 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
                              <Trophy className="h-5 w-5 text-primary" />
                              Podium Predictions
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              Predict which cars will finish 1st, 2nd, and 3rd in the {currentClass.name} class.
                            </p>
                          </div>
                          <PodiumPicker
                            entries={currentClass.entries}
                            predictions={classPodiumPredictions}
                            onSavePredictionsBatch={(updates) =>
                              savePodiumPredictionsBatch(currentClass.id, updates)
                            }
                            disabled={isPastDeadline}
                            saving={saving}
                          />
                        </div>

                        {/* Manufacturer Ranker */}
                        {currentClass.has_manufacturer_prediction && currentClass.manufacturers.length > 0 && (
                          <div className="bg-muted/30 rounded-lg p-4">
                            <div className="mb-4">
                              <h3 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
                                <Flag className="h-5 w-5 text-primary" />
                                Manufacturer Rankings
                              </h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                Rank manufacturers by their predicted <span className="font-medium">average finishing position</span> in the {currentClass.name} class.
                                The manufacturer whose cars have the best average finish should be ranked #1.
                              </p>
                            </div>
                            <ManufacturerRanker
                              manufacturers={currentClass.manufacturers}
                              predictions={classManufacturerPredictions}
                              onSavePredictionsBatch={(updates) =>
                                saveManufacturerPredictionsBatch(currentClass.id, updates)
                              }
                              disabled={isPastDeadline}
                              saving={saving}
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-12">
                        Select a class to make predictions
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Scoring Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="hover:shadow-lg hover:shadow-primary/5 transition-all duration-200">
                <CardHeader>
                  <CardTitle>How Scoring Works</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="font-medium text-card-foreground mb-2">Podium Predictions</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Correctly predict P1: 10 points</li>
                        <li>• Correctly predict P2: 8 points</li>
                        <li>• Correctly predict P3: 6 points</li>
                        <li>• Predicted driver finishes on podium: 3 points</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-card-foreground mb-2">Manufacturer Rankings</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Correct rank prediction: 5 points per manufacturer</li>
                        <li>• One position off: 2 points</li>
                        <li>• Rankings based on average finish position</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </RequireAuth>
  )
}
