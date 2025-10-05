import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', { supabaseUrl, supabaseAnonKey })
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Type exports for your tables
export type Track = {
  id: string
  name: string
}

export type Season = {
  id: string
  season_number: number
  name: string | null
  prediction_deadline: string
  week_1_prediction_deadline: string | null
  starts_at: string | null
  created_at: string
}

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

export type Schedule = {
  id: string
  season_id: string
  week: number
  track_id: string
  race_date: string | null
  created_at: string
}

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

export type TrackNameLookup = {
  id: string
  variation: string
  canonical_track_name: string
  created_at: string
}

// Legacy Nostradouglas predictions (track order predictions)
export type Prediction = {
  id: string
  user_id: string
  season_id: string
  track_id: string
  position: number
  created_at: string
  updated_at: string
}

// Public views
export type DriverPublic = {
  id: string
  first_name: string | null
  last_name: string | null
  short_name: string
  driver_number: number | null
  division: number
  division_split: 'Gold' | 'Silver'
}

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

export type UserProfilePublic = {
  user_id: string
  display_name: string
  created_at: string
}