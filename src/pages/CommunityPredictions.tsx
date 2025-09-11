import { useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Trophy, Clock, CheckCircle, AlertCircle, Target, Award } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useCurrentRace } from '@/hooks/useCurrentRace'
import { useRacePredictions } from '@/hooks/useRacePredictions'
import { useToast } from '@/hooks/useToast'
import { PastPicks } from '@/components/PastPicks'
import { Leaderboard } from '@/components/Leaderboard'
import { Button } from '@/components/ui/button'
import { formatDriverName } from '@/utils/formatting'

const DIVISIONS = [1, 2, 3, 4, 5, 6]
const SPLITS = ['Gold', 'Silver'] as const

export function CommunityPredictions() {
  const { user, loading: authLoading } = useAuth()
  const { schedule, loading: scheduleLoading, deadline, isDeadlinePassed } = useCurrentRace()
  const { 
    drivers, 
    predictions, 
    loading: predictionsLoading, 
    saving,
    error,
    savePrediction,
    deletePrediction,
    getPredictionForDivisionSplit,
    getDriversForDivisionSplit
  } = useRacePredictions(schedule?.id || null)
  const { addToast } = useToast()

  const [selectedDrivers, setSelectedDrivers] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState<'predictions' | 'past-picks' | 'leaderboard'>('predictions')

  const loading = authLoading || scheduleLoading || predictionsLoading

  const handleDriverSelection = async (division: number, split: 'Gold' | 'Silver', driverId: string) => {
    if (!user) {
      addToast({
        title: 'Authentication Required',
        description: 'Please sign in to make predictions',
        variant: 'destructive'
      })
      return
    }

    if (isDeadlinePassed) {
      addToast({
        title: 'Deadline Passed',
        description: 'Prediction deadline has passed',
        variant: 'destructive'
      })
      return
    }

    const key = `${division}-${split}`

    // Handle clearing prediction when default option is selected
    if (!driverId || driverId === '') {
      setSelectedDrivers(prev => {
        const updated = { ...prev }
        delete updated[key]
        return updated
      })

      // Check if there's an existing prediction to delete
      const existingPrediction = getPredictionForDivisionSplit(division, split)
      if (existingPrediction) {
        try {
          await deletePrediction(division, split)
          
          addToast({
            title: 'Cleared',
            description: 'Prediction cleared successfully',
            variant: 'default'
          })
        } catch (error) {
          console.error('Failed to clear prediction:', error)
          addToast({
            title: 'Error',
            description: 'Failed to clear prediction',
            variant: 'destructive'
          })
        }
      }
      return
    }

    setSelectedDrivers(prev => ({ ...prev, [key]: driverId }))

    try {
      await savePrediction(division, split, driverId)
      addToast({
        title: 'Success',
        description: 'Prediction saved successfully!',
        variant: 'success'
      })
    } catch (error) {
      console.error('Failed to save prediction:', error)
      addToast({
        title: 'Error',
        description: 'Failed to save prediction',
        variant: 'destructive'
      })
      // Revert local state on error
      setSelectedDrivers(prev => {
        const updated = { ...prev }
        delete updated[key]
        return updated
      })
    }
  }

  const getSelectedDriver = (division: number, split: 'Gold' | 'Silver') => {
    const key = `${division}-${split}`
    const localSelection = selectedDrivers[key]
    if (localSelection) return localSelection

    const prediction = getPredictionForDivisionSplit(division, split)
    return prediction?.driver_id || ''
  }



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading predictions...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Community Predictions</h1>
          <p className="text-muted-foreground mb-6">
            Sign in to make your predictions for who will win each division and split in the upcoming race!
          </p>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              Choose your predicted winners for each division and split combination. 
              You can change your predictions until the deadline.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Error Loading Data</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Trophy className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Community Predictions</h1>
          </div>
          
          {/* Track and Week Info */}
          <div className="bg-card border border-border rounded-lg p-4 mb-4 inline-block">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🏁</div>
              <div>
                <h2 className="text-xl font-semibold text-card-foreground">
                  {schedule?.track?.name || 'Loading...'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Week {schedule?.week || '---'} • Season {schedule?.season?.season_number || '---'}
                </p>
              </div>
            </div>
          </div>
          
          <p className="text-muted-foreground mb-4">
            Make your predictions for who will win each division and split
          </p>
          
          {/* Deadline Banner */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
            isDeadlinePassed 
              ? 'bg-destructive/10 text-destructive border border-destructive/20' 
              : 'bg-primary/10 text-primary border border-primary/20'
          }`}>
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">
              {isDeadlinePassed 
                ? 'Predictions are now closed' 
                : `Predictions close: ${deadline.toLocaleDateString()} at ${deadline.toLocaleTimeString()}`
              }
            </span>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center mb-8"
        >
          <div className="flex bg-muted p-1 rounded-lg">
            <Button
              variant={activeTab === 'predictions' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('predictions')}
              className="flex items-center gap-2"
            >
              <Target className="h-4 w-4" />
              Make Predictions
            </Button>
            <Button
              variant={activeTab === 'past-picks' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('past-picks')}
              className="flex items-center gap-2"
            >
              <Trophy className="h-4 w-4" />
              Your Results
            </Button>
            <Button
              variant={activeTab === 'leaderboard' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('leaderboard')}
              className="flex items-center gap-2"
            >
              <Award className="h-4 w-4" />
              Leaderboard
            </Button>
          </div>
        </motion.div>

        {/* Tab Content */}
        {activeTab === 'predictions' && (
          <>
            {/* Predictions by Division */}
        <div className="space-y-8">
          {DIVISIONS.map(division => {
            const goldDrivers = getDriversForDivisionSplit(division, 'Gold')
            const silverDrivers = getDriversForDivisionSplit(division, 'Silver')
            const goldSelectedId = getSelectedDriver(division, 'Gold')
            const silverSelectedId = getSelectedDriver(division, 'Silver')
            const goldSelected = goldDrivers.find(d => d.id === goldSelectedId)
            const silverSelected = silverDrivers.find(d => d.id === silverSelectedId)

            return (
              <motion.div
                key={division}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (division - 1) * 0.1 }}
                className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-200"
              >
                {/* Division Header */}
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-6 py-4 border-b border-border">
                  <h2 className="text-xl font-bold text-card-foreground flex items-center gap-2">
                    <span className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                      {division}
                    </span>
                    Division {division}
                  </h2>
                </div>

                {/* Splits Grid */}
                <div className="p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Gold Split */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-4 h-4 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full" />
                        <h3 className="font-semibold text-card-foreground">Gold Split</h3>
                        {goldSelected && (
                          <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                        )}
                      </div>

                      {goldDrivers.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic py-8 text-center bg-muted/20 rounded-lg hover:bg-muted/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                          No drivers in this division
                        </p>
                      ) : (
                        <>
                          {goldSelected ? (
                            <div className={`p-4 rounded-lg border transition-all duration-200 ${isDeadlinePassed 
                              ? 'bg-muted border-border hover:bg-muted/80 hover:shadow-md hover:-translate-y-0.5' 
                              : 'bg-primary/10 border-primary/20 hover:bg-primary/15 hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5'
                            }`}>
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                                {isDeadlinePassed ? 'Final Prediction' : 'Current Prediction'}
                              </p>
                              <p className="font-medium text-card-foreground">
                                {formatDriverName(goldSelected)}
                              </p>
                            </div>
                          ) : isDeadlinePassed ? (
                            <div className="p-4 rounded-lg bg-muted/20 border border-border text-center hover:bg-muted/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                              <p className="text-sm text-muted-foreground italic">No prediction made</p>
                            </div>
                          ) : null}

                          {!isDeadlinePassed && (
                            <select
                              value={goldSelectedId}
                              onChange={(e) => handleDriverSelection(division, 'Gold', e.target.value)}
                              disabled={saving}
                              className="w-full p-3 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 hover:shadow-md hover:border-primary/30 transition-all duration-200"
                            >
                              <option value="">Choose Gold driver...</option>
                              {goldDrivers.map(driver => (
                                <option key={driver.id} value={driver.id}>
                                  {formatDriverName(driver)}
                                </option>
                              ))}
                            </select>
                          )}
                        </>
                      )}
                    </div>

                    {/* Silver Split */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-4 h-4 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full" />
                        <h3 className="font-semibold text-card-foreground">Silver Split</h3>
                        {silverSelected && (
                          <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                        )}
                      </div>

                      {silverDrivers.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic py-8 text-center bg-muted/20 rounded-lg hover:bg-muted/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                          No drivers in this division
                        </p>
                      ) : (
                        <>
                          {silverSelected ? (
                            <div className={`p-4 rounded-lg border transition-all duration-200 ${isDeadlinePassed 
                              ? 'bg-muted border-border hover:bg-muted/80 hover:shadow-md hover:-translate-y-0.5' 
                              : 'bg-primary/10 border-primary/20 hover:bg-primary/15 hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5'
                            }`}>
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                                {isDeadlinePassed ? 'Final Prediction' : 'Current Prediction'}
                              </p>
                              <p className="font-medium text-card-foreground">
                                {formatDriverName(silverSelected)}
                              </p>
                            </div>
                          ) : isDeadlinePassed ? (
                            <div className="p-4 rounded-lg bg-muted/20 border border-border text-center hover:bg-muted/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                              <p className="text-sm text-muted-foreground italic">No prediction made</p>
                            </div>
                          ) : null}

                          {!isDeadlinePassed && (
                            <select
                              value={silverSelectedId}
                              onChange={(e) => handleDriverSelection(division, 'Silver', e.target.value)}
                              disabled={saving}
                              className="w-full p-3 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 hover:shadow-md hover:border-primary/30 transition-all duration-200"
                            >
                              <option value="">Choose Silver driver...</option>
                              {silverDrivers.map(driver => (
                                <option key={driver.id} value={driver.id}>
                                  {formatDriverName(driver)}
                                </option>
                              ))}
                            </select>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

            {/* Info Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-8 bg-card border border-border rounded-lg p-6 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-200"
            >
              <h3 className="text-lg font-semibold text-card-foreground mb-3">How it Works</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium text-card-foreground mb-2">Making Predictions</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Select one driver per division/split combination</li>
                    <li>• You can change your predictions until the deadline</li>
                    <li>• All predictions are automatically saved</li>
                    <li>• <span className="text-destructive font-medium">Missing predictions receive penalty points</span></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-card-foreground mb-2">Scoring System</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Golf style scoring - <strong>lower is better</strong></li>
                    <li>• Points = your driver's position in their split</li>
                    <li>• Missing predictions = (participants + 1) penalty</li>
                    <li>• DNF drivers = (participants + 1) penalty</li>
                    <li>• Fair competition requires all predictions</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {/* Past Picks Tab */}
        {activeTab === 'past-picks' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <PastPicks seasonId={schedule?.season_id || null} />
          </motion.div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Leaderboard seasonId={schedule?.season_id || null} />
          </motion.div>
        )}
      </div>
    </div>
  )
}