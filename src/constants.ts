/**
 * Application-wide constants
 *
 * This file contains all shared constant values used across the application
 * to ensure consistency and make updates easier.
 */

import type { DivisionSplit } from '@/lib/types'

// ============================================================================
// Racing Constants
// ============================================================================

/**
 * All available divisions in the racing league (1-6)
 */
export const DIVISIONS = [1, 2, 3, 4, 5, 6] as const

/**
 * Division split types
 */
export const SPLITS: readonly DivisionSplit[] = ['Gold', 'Silver'] as const

/**
 * Type for division numbers
 */
export type Division = typeof DIVISIONS[number]

// ============================================================================
// Nostradouglas (Track Prediction) Constants
// ============================================================================

/**
 * Maximum number of tracks that can be predicted in a normal season
 */
export const MAX_TRACKS = 8

/**
 * Reduced number of tracks when week 1 deadline has passed
 */
export const MAX_TRACKS_AFTER_WEEK_1 = 7

/**
 * Nostradouglas scoring rules
 * Track and week matching points are combined to calculate total prediction points
 */
export const NOSTRADOUGLAS_SCORING = {
  /**
   * Points awarded for matching the track correctly (regardless of week)
   */
  TRACK_MATCH_POINTS: 10,

  /**
   * Points awarded for matching the week correctly (regardless of track)
   */
  WEEK_MATCH_POINTS: 5,

  /**
   * Points awarded for a perfect match (both track and week correct)
   * This is track_match_points + week_match_points
   */
  PERFECT_MATCH_POINTS: 15,

  /**
   * Penalty points applied for missing predictions
   * Note: Lower is better in golf-style scoring
   */
  MISSING_PREDICTION_PENALTY: 20,
} as const

/**
 * Nostradouglas result status types
 */
export const NOSTRADOUGLAS_STATUS = {
  PERFECT_MATCH: 'Perfect Match',
  TRACK_MATCH_ONLY: 'Track Match Only',
  NO_MATCH: 'No Match',
} as const

export type NostradouglasStatus = typeof NOSTRADOUGLAS_STATUS[keyof typeof NOSTRADOUGLAS_STATUS]

// ============================================================================
// Community Predictions (Race Winner) Constants
// ============================================================================

/**
 * Community predictions configuration
 */
export const COMMUNITY_PREDICTIONS = {
  /**
   * Number of divisions to show predictions for
   */
  DIVISIONS_COUNT: DIVISIONS.length,

  /**
   * Splits per division
   */
  SPLITS_PER_DIVISION: SPLITS.length,
} as const

// ============================================================================
// Validation Constants
// ============================================================================

/**
 * Minimum number of tracks required for Nostradouglas submission
 */
export const MIN_TRACKS_REQUIRED = MAX_TRACKS

/**
 * Minimum number of tracks required when week 1 deadline has passed
 */
export const MIN_TRACKS_REQUIRED_AFTER_WEEK_1 = MAX_TRACKS_AFTER_WEEK_1

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if a value is a valid division
 */
export function isValidDivision(value: number): value is Division {
  return DIVISIONS.includes(value as Division)
}

/**
 * Check if a value is a valid split
 */
export function isValidSplit(value: string): value is DivisionSplit {
  return SPLITS.includes(value as DivisionSplit)
}

/**
 * Get the maximum tracks allowed based on week 1 deadline status
 */
export function getMaxTracks(isWeek1DeadlinePassed: boolean, hasSavedWeek1Prediction: boolean): number {
  return (isWeek1DeadlinePassed && !hasSavedWeek1Prediction) ? MAX_TRACKS_AFTER_WEEK_1 : MAX_TRACKS
}

/**
 * Get the required number of tracks based on week 1 deadline status
 */
export function getRequiredTracks(isWeek1DeadlinePassed: boolean, hasSavedWeek1Prediction: boolean): number {
  return (isWeek1DeadlinePassed && !hasSavedWeek1Prediction) ? MIN_TRACKS_REQUIRED_AFTER_WEEK_1 : MIN_TRACKS_REQUIRED
}

/**
 * Get the starting position for track predictions based on week 1 deadline status
 */
export function getStartPosition(isWeek1DeadlinePassed: boolean, hasSavedWeek1Prediction: boolean): number {
  return (isWeek1DeadlinePassed && !hasSavedWeek1Prediction) ? 2 : 1
}
