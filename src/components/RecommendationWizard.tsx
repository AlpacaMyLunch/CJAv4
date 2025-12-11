import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Star, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StarRating } from '@/components/ui/StarRating'
import { useRecommendations } from '@/hooks/useRecommendations'
import type { Game, CarClass } from '@/lib/supabase'

interface RecommendationWizardProps {
  games: Game[]
  carClasses: CarClass[]
}

export function RecommendationWizard({ games, carClasses }: RecommendationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedGames, setSelectedGames] = useState<Set<string>>(new Set())
  const [selectedCarClasses, setSelectedCarClasses] = useState<Record<string, Set<string>>>({})

  // Build preferences for recommendations
  const preferences = Array.from(selectedGames).flatMap(gameId => {
    const gameCarClasses = selectedCarClasses[gameId]
    if (!gameCarClasses || gameCarClasses.size === 0) {
      return [{ gameId }]
    }
    return Array.from(gameCarClasses).map(carClassId => ({ gameId, carClassId }))
  })

  const { recommendations, loading, error } = useRecommendations(currentStep === 3 ? preferences : [])

  const toggleGame = (gameId: string) => {
    const newSelected = new Set(selectedGames)
    if (newSelected.has(gameId)) {
      newSelected.delete(gameId)
      // Remove car class selections for this game
      const newCarClasses = { ...selectedCarClasses }
      delete newCarClasses[gameId]
      setSelectedCarClasses(newCarClasses)
    } else {
      newSelected.add(gameId)
    }
    setSelectedGames(newSelected)
  }

  const toggleCarClass = (gameId: string, carClassId: string) => {
    const newCarClasses = { ...selectedCarClasses }
    if (!newCarClasses[gameId]) {
      newCarClasses[gameId] = new Set()
    }
    if (newCarClasses[gameId].has(carClassId)) {
      newCarClasses[gameId].delete(carClassId)
    } else {
      newCarClasses[gameId].add(carClassId)
    }
    setSelectedCarClasses(newCarClasses)
  }

  const canGoNext = () => {
    if (currentStep === 1) return selectedGames.size > 0
    return true
  }

  const handleNext = () => {
    if (currentStep < 3 && canGoNext()) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3].map(step => (
          <div
            key={step}
            className={`flex items-center ${step < 3 ? 'flex-1 max-w-[100px]' : ''}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-medium transition-colors ${
                step === currentStep
                  ? 'bg-primary text-primary-foreground'
                  : step < currentStep
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {step < currentStep ? <CheckCircle className="h-4 w-4" /> : step}
            </div>
            {step < 3 && (
              <div
                className={`flex-1 h-1 mx-2 rounded transition-colors ${
                  step < currentStep ? 'bg-primary/20' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>What do you play?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {games.map(game => (
                    <button
                      key={game.id}
                      onClick={() => toggleGame(game.id)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        selectedGames.has(game.id)
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{game.name}</span>
                        {selectedGames.has(game.id) && (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                {selectedGames.size === 0 && (
                  <p className="text-sm text-muted-foreground mt-4 text-center">
                    Select at least one game to continue
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {currentStep === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>What do you drive?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {Array.from(selectedGames).map(gameId => {
                  const game = games.find(g => g.id === gameId)
                  const gameCarClasses = carClasses.filter(cc => cc.game_id === gameId)

                  return (
                    <div key={gameId} className="space-y-3">
                      <h3 className="font-semibold text-lg">{game?.name}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {gameCarClasses.map(carClass => (
                          <button
                            key={carClass.id}
                            onClick={() => toggleCarClass(gameId, carClass.id)}
                            className={`p-3 rounded-lg border-2 transition-all text-left ${
                              selectedCarClasses[gameId]?.has(carClass.id)
                                ? 'border-primary bg-primary/10'
                                : 'border-border hover:border-primary/50 hover:bg-muted/50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{carClass.name}</span>
                              {selectedCarClasses[gameId]?.has(carClass.id) && (
                                <CheckCircle className="h-4 w-4 text-primary" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Leave empty to see recommendations for all car classes
                      </p>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {currentStep === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Your Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Analyzing reviews...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-8 text-destructive">
                    Error loading recommendations: {error}
                  </div>
                ) : recommendations.length === 0 ? (
                  <div className="text-center py-12">
                    <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground mb-2">No reviews yet for your selections</p>
                    <p className="text-sm text-muted-foreground">
                      Be the first to review a setup shop for these preferences!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recommendations.map((rec, index) => (
                      <div
                        key={rec.shop.id}
                        className="bg-gradient-to-br from-card to-card/50 border border-border rounded-xl p-5 hover:shadow-lg hover:shadow-primary/5 transition-all"
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-lg flex items-center justify-center font-bold">
                                {index + 1}
                              </div>
                              <h3 className="text-xl font-bold">{rec.shop.name}</h3>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="secondary">{rec.shop.price_tier}</Badge>
                              <Badge variant="outline">{rec.shop.price_model}</Badge>
                              {rec.matchedGames.map(game => (
                                <Badge key={game} variant="secondary">
                                  {game}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-black text-primary">
                              {rec.averageScore.toFixed(1)}
                            </div>
                            <StarRating value={rec.averageScore} size="sm" showValue={false} />
                            <div className="text-xs text-muted-foreground mt-1">
                              {rec.reviewCount} {rec.reviewCount === 1 ? 'review' : 'reviews'}
                            </div>
                          </div>
                        </div>

                        {/* Factor Breakdown */}
                        <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                          {Object.entries(rec.factorBreakdown).map(([factor, score]) => (
                            <div key={factor} className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">{factor}</span>
                              <StarRating value={score} size="sm" showValue={false} />
                            </div>
                          ))}
                        </div>

                        {/* App Score */}
                        {rec.appScore && (
                          <div className="mt-4 bg-primary/10 rounded-lg p-3 flex items-center justify-between">
                            <span className="text-sm font-medium">App Score</span>
                            <div className="flex items-center gap-2">
                              <StarRating value={rec.appScore} size="sm" showValue={false} />
                              <span className="text-sm font-semibold">{rec.appScore.toFixed(1)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        {currentStep < 3 && (
          <Button
            onClick={handleNext}
            disabled={!canGoNext()}
            className="flex items-center gap-2"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
