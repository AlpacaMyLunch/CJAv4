import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', { supabaseUrl, supabaseAnonKey })
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Re-export all types from centralized types file
export type {
  // Core Racing
  Season,
  Track,
  TrackNameLookup,
  Schedule,
  ScheduleWithTrack,

  // Drivers
  Driver,
  DriverPublic,

  // Race Results
  RaceResult,
  RaceResultPublic,

  // Predictions
  RacePrediction,
  Prediction,

  // User Profiles
  UserProfilePublic,

  // Nostradouglas
  NostradouglasLeaderboard,
  NostradouglasDetailedResults,

  // Setup Shops
  SetupShop,
  Game,
  CarClass,
  ShopGame,
  RatingFactor,
  ShopReview,
  ReviewRating,
  AppReview,
  AppReviewRating,

  // Utility Types
  DivisionSplit,
  ReviewStatus,
  RatingCategory,

  // IMSA Predictions
  ImsaEvent,
  ImsaClass,
  ImsaManufacturer,
  ImsaEntry,
  ImsaPodiumPrediction,
  ImsaManufacturerPrediction,
  ImsaEntryResult,
  ImsaManufacturerResult,
  ImsaScoringRule,
  ImsaUserEventScore,
  ImsaEventLeaderboardRow,
  ImsaSeasonLeaderboardRow,
  ImsaAllTimeLeaderboardRow,
  ImsaEntryWithDetails,
  ImsaClassWithEntries,
  ImsaEventWithClasses,
  ImsaEventInsert,
  ImsaClassInsert,
  ImsaManufacturerInsert,
  ImsaEntryInsert,
  ImsaPodiumPredictionInsert,
  ImsaManufacturerPredictionInsert,
  ImsaEntryResultInsert,
  ImsaManufacturerResultInsert,
  ImsaPodiumPredictionUpdate,
  ImsaManufacturerPredictionUpdate,
  ImsaEntryStatus,
  ImsaScoringCategory,
} from './types'