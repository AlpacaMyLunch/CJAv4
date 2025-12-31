/**
 * Database Types for CJA Web Application
 *
 * This file contains all database table types and derived view types.
 *
 * Naming conventions:
 * - Base types represent the actual database table structure
 * - Types ending in "Public" are views that exclude sensitive fields
 * - Types ending in "WithRelations" include joined data from related tables
 */

// ============================================================================
// Core Racing Tables
// ============================================================================

export type Season = {
  id: string
  season_number: number
  name: string | null
  prediction_deadline: string
  week_1_prediction_deadline: string | null
  starts_at: string | null
  created_at: string
}

export type Track = {
  id: string
  name: string
}

export type TrackNameLookup = {
  id: string
  variation: string
  canonical_track_name: string
  created_at: string
}

export type Schedule = {
  id: string
  season_id: string
  week: number
  track_id: string
  race_date: string | null
  created_at: string
}

/**
 * Schedule with joined track information
 */
export type ScheduleWithTrack = {
  id: string
  season_id: string
  week: number
  track_id: string
  track_name: string
  race_date: string | null
  created_at: string
}

// ============================================================================
// Driver Tables and Views
// ============================================================================

/**
 * Full driver table - includes sensitive fields
 * Use DriverPublic for client-side display
 */
export type Driver = {
  id: string
  steam_id_sha256: string
  discord_id: string | null
  discord_username: string | null
  first_name: string | null
  last_name: string | null
  short_name: string
  division: number
  division_split: 'Gold' | 'Silver'
  driver_number: number | null
  created_at: string
  updated_at: string
}

/**
 * Public driver view - excludes sensitive fields like steam_id and discord info
 */
export type DriverPublic = Pick<
  Driver,
  'id' | 'first_name' | 'last_name' | 'short_name' | 'driver_number' | 'division' | 'division_split'
>

// ============================================================================
// Race Results
// ============================================================================

/**
 * Base race result table
 */
export type RaceResult = {
  id: string
  schedule_id: string
  division: number
  split: 'Gold' | 'Silver'
  driver_id: string
  finish_position: number
  created_at: string
  updated_at: string
}

/**
 * Denormalized race result view with joined schedule and driver data
 */
export type RaceResultPublic = {
  id: string
  schedule_id: string
  race_date: string | null
  week: number
  track_name: string
  division: number
  split: 'Gold' | 'Silver'
  driver_id: string
  steam_id_sha256: string
  first_name: string | null
  last_name: string | null
  short_name: string
  driver_number: number | null
  finish_position: number
  split_position: number
  created_at: string
  updated_at: string
}

// ============================================================================
// Predictions
// ============================================================================

/**
 * Race predictions - predicting race winners
 */
export type RacePrediction = {
  id: string
  user_id: string
  schedule_id: string
  division: number
  split: 'Gold' | 'Silver'
  driver_id: string
  created_at: string
  updated_at: string
}

/**
 * Legacy Nostradouglas predictions - predicting track order
 */
export type Prediction = {
  id: string
  user_id: string
  season_id: string
  track_id: string
  position: number
  created_at: string
  updated_at: string
}

// ============================================================================
// User Profiles
// ============================================================================

/**
 * Public user profile view
 */
export type UserProfilePublic = {
  user_id: string
  display_name: string
  created_at: string
}

// ============================================================================
// Nostradouglas Leaderboard Views
// ============================================================================

export type NostradouglasLeaderboard = {
  user_id: string
  display_name: string
  season_id: string
  season_name: string | null
  season_number: number
  total_points: number
  track_points: number
  week_points: number
  predictions_made: number
  rank: number
}

export type NostradouglasDetailedResults = {
  user_id: string
  display_name: string
  season_id: string
  season_name: string | null
  predicted_week: number
  predicted_track: string
  actual_week: number | null
  track_match_points: number
  week_match_points: number
  prediction_points: number
  status: 'Perfect Match' | 'Track Match Only' | 'No Match'
}

// ============================================================================
// Setup Shop Review System
// ============================================================================

export type SetupShop = {
  id: string
  name: string
  website_url: string
  has_app: boolean
  created_at: string
  updated_at: string
}

export type Game = {
  id: string
  name: string
  short_name: string
  created_at: string
}

export type CarClass = {
  id: string
  game_id: string
  name: string
  created_at: string
}

export type ShopGame = {
  shop_id: string
  game_id: string
}

export type RatingFactor = {
  id: string
  category: 'setup' | 'app'
  name: string
  description: string
  display_order: number
  created_at: string
}

/**
 * Setup review for a specific shop/game/car-class combination
 */
export type ShopReview = {
  id: string
  user_id: string
  shop_id: string
  game_id: string
  car_class_id: string
  comments: string | null
  is_current: boolean
  supersedes_id: string | null
  created_at: string
  updated_at: string
}

/**
 * Individual rating for a setup review factor
 */
export type ReviewRating = {
  id: string
  review_id: string
  factor_id: string
  score: number
  created_at: string
}

/**
 * App review for a setup shop's companion app
 */
export type AppReview = {
  id: string
  user_id: string
  shop_id: string
  game_id: string | null
  comments: string | null
  is_current: boolean
  supersedes_id: string | null
  created_at: string
  updated_at: string
}

/**
 * Individual rating for an app review factor
 */
export type AppReviewRating = {
  id: string
  review_id: string
  factor_id: string
  score: number
  created_at: string
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Common division split type used across tables
 */
export type DivisionSplit = 'Gold' | 'Silver'

/**
 * Review status types
 */
export type ReviewStatus = 'Perfect Match' | 'Track Match Only' | 'No Match'

/**
 * Rating category types
 */
export type RatingCategory = 'setup' | 'app'
