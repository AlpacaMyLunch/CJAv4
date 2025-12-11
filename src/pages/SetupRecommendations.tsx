import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useSetupShopData } from '@/hooks/useSetupShopData'
import { RecommendationWizard } from '@/components/RecommendationWizard'
import { Card, CardContent } from '@/components/ui/card'

export function SetupRecommendations() {
  const { games, carClasses, loading } = useSetupShopData()

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="p-12 text-center">
              <div className="animate-pulse">
                <Sparkles className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Loading recommendations...</p>
              </div>
            </CardContent>
          </Card>
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
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Setup Shop Recommendations</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Tell us what you play and drive, and we'll recommend the best setup shops based on community reviews and ratings.
          </p>
        </motion.div>

        {/* Recommendation Wizard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <RecommendationWizard games={games} carClasses={carClasses} />
        </motion.div>
      </div>
    </div>
  )
}
