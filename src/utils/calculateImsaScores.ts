import { supabase } from '@/lib/supabase'
import type {
  ImsaScoringRule,
  ImsaEntryResult,
  ImsaPodiumPrediction,
  ImsaManufacturerPrediction,
  ImsaClass
} from '@/lib/supabase'

interface EntryResultWithEntry extends ImsaEntryResult {
  entry: {
    id: string
    class_id: string
    manufacturer_id: string
  } | null
}

interface CalculateScoresResult {
  success: boolean
  error?: string
  usersScored?: number
}

export async function calculateImsaScores(eventId: string): Promise<CalculateScoresResult> {
  try {
    // 1. Fetch scoring rules
    const { data: scoringRules, error: rulesError } = await supabase
      .from('imsa_scoring_rules')
      .select('*')

    if (rulesError || !scoringRules) {
      throw new Error(`Could not fetch scoring rules: ${rulesError?.message}`)
    }

    // 2. Fetch all entry results for this event
    const { data: entryResults, error: resultsError } = await supabase
      .from('imsa_entry_results')
      .select('*, entry:imsa_entries(id, class_id, manufacturer_id)')
      .eq('event_id', eventId)

    if (resultsError) {
      throw new Error(`Could not fetch entry results: ${resultsError.message}`)
    }

    if (!entryResults || entryResults.length === 0) {
      throw new Error('No results found for this event. Enter results first.')
    }

    const typedResults = entryResults as EntryResultWithEntry[]

    // 3. Fetch all podium predictions for this event
    const { data: podiumPredictions, error: podiumError } = await supabase
      .from('imsa_podium_predictions')
      .select('*')
      .eq('event_id', eventId)

    if (podiumError) {
      throw new Error(`Could not fetch podium predictions: ${podiumError.message}`)
    }

    // 4. Fetch all manufacturer predictions for this event
    const { data: manufacturerPredictions, error: mfrPredError } = await supabase
      .from('imsa_manufacturer_predictions')
      .select('*')
      .eq('event_id', eventId)

    if (mfrPredError) {
      throw new Error(`Could not fetch manufacturer predictions: ${mfrPredError.message}`)
    }

    // 5. Fetch classes to know which have manufacturer predictions
    const { data: classes, error: classesError } = await supabase
      .from('imsa_classes')
      .select('*')
      .eq('event_id', eventId)

    if (classesError) {
      throw new Error(`Could not fetch classes: ${classesError.message}`)
    }

    // 6. Build lookup: entry_id -> finish_position
    const entryFinishPosition: Record<string, number> = {}
    typedResults.forEach(r => {
      if (r.status === 'finished' || r.status === 'DNF') {
        entryFinishPosition[r.entry_id] = r.finish_position
      }
    })

    // 7. Calculate manufacturer average positions and ranks per class
    const manufacturerResults: Record<string, { avg: number; rank: number }> = {}

    for (const cls of (classes as ImsaClass[]) || []) {
      if (!cls.has_manufacturer_prediction) continue

      // Get all results for this class
      const classResults = typedResults.filter(r => r.entry?.class_id === cls.id)

      // Group by manufacturer
      const mfrFinishes: Record<string, number[]> = {}
      classResults.forEach(r => {
        const mfrId = r.entry?.manufacturer_id
        if (mfrId && r.status === 'finished') {
          if (!mfrFinishes[mfrId]) mfrFinishes[mfrId] = []
          mfrFinishes[mfrId].push(r.finish_position)
        }
      })

      // Calculate averages
      const mfrAverages: { id: string; avg: number }[] = []
      for (const [mfrId, finishes] of Object.entries(mfrFinishes)) {
        const avg = finishes.reduce((a, b) => a + b, 0) / finishes.length
        mfrAverages.push({ id: mfrId, avg })
      }

      // Sort by average (lower is better) and assign ranks
      mfrAverages.sort((a, b) => a.avg - b.avg)
      mfrAverages.forEach((m, idx) => {
        manufacturerResults[`${cls.id}-${m.id}`] = { avg: m.avg, rank: idx + 1 }
      })

      // Save manufacturer results to database
      for (const m of mfrAverages) {
        await supabase
          .from('imsa_manufacturer_results')
          .upsert({
            event_id: eventId,
            class_id: cls.id,
            manufacturer_id: m.id,
            avg_finish_position: m.avg,
            final_rank: manufacturerResults[`${cls.id}-${m.id}`].rank
          }, { onConflict: 'event_id,class_id,manufacturer_id' })
      }
    }

    // 8. Calculate user scores
    const userScores: Record<string, { podium: number; manufacturer: number; predictions: number }> = {}

    // Helper to get podium scoring rule points
    const getPodiumPoints = (predictedPosition: number, actualFinish: number): number => {
      // Check for exact match first
      if (actualFinish === predictedPosition) {
        const exactRule = scoringRules.find((r: ImsaScoringRule) =>
          r.category === 'podium' &&
          r.prediction_position === predictedPosition &&
          r.result_type === 'exact'
        )
        return exactRule?.points || 0
      }

      // Check if predicted driver finished on podium (but wrong position)
      if (actualFinish >= 1 && actualFinish <= 3) {
        const podiumRule = scoringRules.find((r: ImsaScoringRule) =>
          r.category === 'podium' &&
          r.prediction_position === predictedPosition &&
          r.result_type === 'on_podium'
        )
        return podiumRule?.points || 0
      }

      // Check if predicted driver finished top 5
      if (actualFinish >= 4 && actualFinish <= 5) {
        const top5Rule = scoringRules.find((r: ImsaScoringRule) =>
          r.category === 'podium' &&
          r.prediction_position === predictedPosition &&
          r.result_type === 'top_5'
        )
        return top5Rule?.points || 0
      }

      return 0
    }

    // Helper to get manufacturer scoring rule points
    const getManufacturerPoints = (predictedRank: number, actualRank: number): number => {
      const diff = Math.abs(predictedRank - actualRank)
      if (diff === 0) {
        return scoringRules.find((r: ImsaScoringRule) =>
          r.category === 'manufacturer' && r.result_type === 'exact'
        )?.points || 0
      } else if (diff === 1) {
        return scoringRules.find((r: ImsaScoringRule) =>
          r.category === 'manufacturer' && r.result_type === 'off_1'
        )?.points || 0
      } else if (diff === 2) {
        return scoringRules.find((r: ImsaScoringRule) =>
          r.category === 'manufacturer' && r.result_type === 'off_2'
        )?.points || 0
      }
      return 0
    }

    // Score podium predictions
    for (const pred of (podiumPredictions as ImsaPodiumPrediction[]) || []) {
      if (!userScores[pred.user_id]) {
        userScores[pred.user_id] = { podium: 0, manufacturer: 0, predictions: 0 }
      }

      const actualFinish = entryFinishPosition[pred.entry_id]
      if (actualFinish) {
        const points = getPodiumPoints(pred.position, actualFinish)
        userScores[pred.user_id].podium += points
      }
      userScores[pred.user_id].predictions++
    }

    // Score manufacturer predictions
    for (const pred of (manufacturerPredictions as ImsaManufacturerPrediction[]) || []) {
      if (!userScores[pred.user_id]) {
        userScores[pred.user_id] = { podium: 0, manufacturer: 0, predictions: 0 }
      }

      const key = `${pred.class_id}-${pred.manufacturer_id}`
      const actualRank = manufacturerResults[key]?.rank
      if (actualRank) {
        const points = getManufacturerPoints(pred.predicted_rank, actualRank)
        userScores[pred.user_id].manufacturer += points
      }
      userScores[pred.user_id].predictions++
    }

    // 9. Save user scores to database
    for (const [userId, scores] of Object.entries(userScores)) {
      const { error: scoreError } = await supabase
        .from('imsa_user_event_scores')
        .upsert({
          user_id: userId,
          event_id: eventId,
          podium_points: scores.podium,
          manufacturer_points: scores.manufacturer,
          total_points: scores.podium + scores.manufacturer,
          predictions_made: scores.predictions,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,event_id' })

      if (scoreError) {
        console.error(`Failed to save score for user ${userId}:`, scoreError)
      }
    }

    return {
      success: true,
      usersScored: Object.keys(userScores).length
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    }
  }
}
