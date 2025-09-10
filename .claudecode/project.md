# Coach Jeffries Academy

Sim racing league platform with predictions and fantasy features.

## Project Overview
- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui components
- Supabase for backend (PostgreSQL + Auth)
- Discord OAuth for authentication
- Hosted on Netlify

## Current Features
1. **Nostradouglas**: Track order predictions for upcoming seasons
   - Users predict which 8 tracks will be raced and in what order
   - Predictions hidden from others until deadline passes
   - Support for multiple divisions (1-6) and splits (Gold/Silver)

## Database Schema
- tracks: Available racing tracks
- seasons: Season configurations with division/split
- nostradouglas: User predictions
- season_tracks: Actual track order (revealed after season starts)

## Code Standards
- Use functional components with TypeScript
- Implement error boundaries for all features
- Use React Query for all data fetching
- Follow shadcn/ui component patterns
- Keep components small and focused
- Use Tailwind classes, avoid inline styles

## File Structure
- /components/ui: shadcn components (don't modify)
- /features: Feature-specific components
- /hooks: Custom React hooks
- /lib: Utilities and configurations

## Racing Domain Context
- 6 divisions total
- Each division has Gold and Silver splits
- 8 races per season
- Discord authentication required















# Sim Racing Database Schema - Technical Reference for Claude Code

## Database Overview
PostgreSQL database managing sim racing league with 8 tables + 3 views. Multi-division racing with comprehensive RLS security. Current focus: Season 16 with 8-week schedule.

## Quick Reference
- **Primary Tables**: seasons, drivers, tracks, schedule, race_results, predictions
- **Legacy**: nostradouglas (old prediction system)  
- **Lookup**: track_name_lookup (name normalization)
- **Views**: Public access layers
- **External**: auth.users (Supabase Auth)

## Complete Table Schemas

### `seasons` - Season Management
Core season definitions (1 record per actual season).
```sql
CREATE TABLE seasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_number INTEGER NOT NULL UNIQUE,
    name VARCHAR(255),
    prediction_deadline TIMESTAMPTZ NOT NULL,
    starts_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```
**Security**: Read-only authenticated  
**Current**: Season 16 "GT3 Team Series", starts 2025-11-05

### `tracks` - Circuit Definitions
Racing track registry with canonical names.
```sql
CREATE TABLE tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE
);
```
**Security**: Public read  
**Count**: 25 tracks (Monza, Spa-Francochamps, Nürburgring, etc.)

### `track_name_lookup` - Name Normalization
Maps track name variations to canonical forms.
```sql
CREATE TABLE track_name_lookup (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variation VARCHAR(255) NOT NULL UNIQUE,
    canonical_track_name VARCHAR(255) NOT NULL REFERENCES tracks(name) ON UPDATE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```
**Security**: Read-only all users  
**Examples**: "Nurburgring" → "Nürburgring", "COTA" → "Circuit of the Americas"

### `drivers` - Driver Registry
Driver profiles and current division/split assignments.
```sql
CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    steam_id_sha256 VARCHAR(64) NOT NULL UNIQUE,  -- Identity key
    discord_id VARCHAR(32) UNIQUE,
    discord_username VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    short_name VARCHAR(50) NOT NULL,
    division INTEGER NOT NULL CHECK (division >= 1 AND division <= 6),
    division_split VARCHAR(10) NOT NULL CHECK (division_split IN ('Gold', 'Silver')),
    driver_number INTEGER UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```
**Security**: Read-only authenticated  
**Identity**: steam_id_sha256 is source of truth  
**Current**: 24 drivers across 6 divisions × 2 splits

### `schedule` - Race Calendar
Links seasons to tracks by race week (8 weeks per season).
```sql
CREATE TABLE schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    week INTEGER NOT NULL CHECK (week >= 1 AND week <= 8),
    track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    race_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(season_id, week),
    UNIQUE(season_id, track_id)
);
```
**Security**: Read-only authenticated  
**Current**: Season 16 schedule: Paul Ricard → Nürburgring → Barcelona → Donington → Hungaroring → Laguna Seca → Kyalami → Monza

### `race_results` - Race Outcomes
Actual race results preserving historical division/split assignments.
```sql
CREATE TABLE race_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID NOT NULL REFERENCES schedule(id) ON DELETE CASCADE,
    division INTEGER NOT NULL CHECK (division >= 1 AND division <= 6),
    split VARCHAR(10) NOT NULL,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    finish_position INTEGER NOT NULL CHECK (finish_position >= 1),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(schedule_id, division, split, driver_id),
    UNIQUE(schedule_id, division, split, finish_position)
);
```
**Security**: Read-only authenticated  
**Key Rule**: Division/split preserved from race time, only finish_position updates allowed

### `predictions` - User Race Predictions
Users predict race winners by division/split.
```sql
CREATE TABLE predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    schedule_id UUID NOT NULL REFERENCES schedule(id) ON DELETE CASCADE,
    division INTEGER NOT NULL CHECK (division >= 1 AND division <= 6),
    split VARCHAR(10) NOT NULL,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, schedule_id, division, split)  -- One prediction per race per division/split
);
```
**Security**: Users own records only (auth.uid() = user_id)

### `nostradouglas` - Schedule Predictions
Users predict the race schedule order for upcoming seasons.
```sql
CREATE TABLE nostradouglas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    season_id UUID REFERENCES seasons(id) ON DELETE CASCADE,
    track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
    position INTEGER NOT NULL CHECK (position >= 1 AND position <= 8),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, season_id, position),  -- One user per position per season
    UNIQUE(user_id, season_id, track_id)   -- One prediction per track per user
);
```
**Security**: Users own records only  
**Purpose**: Users predict which tracks will be in weeks 1-8 of the season schedule

## Views

### `drivers_public` - Public Driver Info
Safe subset of driver data for public display.
```sql
CREATE VIEW drivers_public AS
SELECT 
    first_name,
    last_name, 
    short_name,
    driver_number,
    division,
    division_split
FROM drivers;
```
**Security**: Public access

### `race_results_public` - Enhanced Race Results
Complete race results with driver/track names and split positioning.
```sql
CREATE VIEW race_results_public AS
SELECT 
    rr.id,
    rr.schedule_id,
    s.race_date,
    s.week,
    t.name AS track_name,
    rr.division,
    rr.split,
    rr.driver_id,
    d.steam_id_sha256,
    d.first_name,
    d.last_name,
    d.short_name,
    d.driver_number,
    rr.finish_position,  -- Overall race position
    ROW_NUMBER() OVER (
        PARTITION BY rr.schedule_id, rr.division, rr.split 
        ORDER BY rr.finish_position
    ) AS split_position,  -- Position within division/split
    rr.created_at,
    rr.updated_at
FROM race_results rr
JOIN drivers d ON d.id = rr.driver_id
JOIN schedule s ON s.id = rr.schedule_id
JOIN tracks t ON t.id = s.track_id
ORDER BY s.week, rr.division, rr.split, rr.finish_position;
```
**Security**: Public access  
**Key Feature**: `split_position` ranks drivers within their division/split

### `user_profiles_public` - User Display Names
Safe user profile info from Supabase Auth.
```sql
CREATE VIEW user_profiles_public AS
SELECT 
    id AS user_id,
    COALESCE(
        raw_user_meta_data->>'full_name',
        email::text,
        'Anonymous'
    ) AS display_name,
    created_at
FROM auth.users;
```
**Security**: Public access

## Security Model (Row Level Security)

### Write Access (User Data Only)
```sql
-- Users manage own predictions
auth.uid() = user_id
```
Tables: `predictions`, `nostradouglas`

### Read Access Levels
- **Public**: `tracks`, `drivers_public`, `race_results_public`, `user_profiles_public`, `track_name_lookup`
- **Authenticated**: `seasons`, `schedule`, `race_results`, `drivers`  
- **User-Specific**: `predictions`, `nostradouglas` (own records)

### No Write Access
Core data tables are read-only: `seasons`, `drivers`, `tracks`, `schedule`, `race_results`

## Data Relationships

### Primary Flow
```
Season → Schedule → Race Results
         ↓           ↑
      Tracks ← Track Lookup
```

### User Flow  
```
auth.users → Predictions → Drivers
           → Nostradouglas (legacy)
```

### Driver Identity
```
steam_id_sha256 (source of truth) → All driver operations
```

## Application Patterns

### Driver Management
```python
# Upsert using steam_id_sha256 as identity
driver_data = {
    'steam_id_sha256': '...',
    'division': int(division),
    'driver_number': int(number) if number else None
}
supabase.table('drivers').upsert(driver_data).execute()
```

### Track Name Normalization  
```python
def normalize_track_name(track_name):
    # 1. Try exact match in tracks table
    # 2. Try lookup in track_name_lookup table
    # 3. Return original if no match
```

### Race Results Processing
```python
# Preserve historical division/split
# Only update finish_position on existing records
# Insert new records with division from HTML + current driver split
```

### User Predictions
```python
# One prediction per user/race/division/split
# Users can only manage their own predictions
```

## Key Constraints & Validations

### Data Integrity
- **Divisions**: 1-6 range enforced
- **Splits**: 'Gold'/'Silver' only
- **Weeks**: 1-8 range for schedule
- **Positions**: ≥1 for all position fields
- **Uniqueness**: Prevents duplicate predictions/results

### Business Rules
- Steam ID is driver identity source of truth
- Historical race division/split preserved
- Track names normalized via lookup table
- Users isolated to own prediction data

## Current Data State
- **Season 16**: Active with 8-week schedule
- **24 Drivers**: Distributed across divisions/splits  
- **25 Tracks**: Major sim racing circuits
- **Track Variants**: Normalized via lookup table

## Development Guidelines

### For Data Modification
- Use steam_id_sha256 for driver identity
- Preserve race result division/split history
- Normalize track names before DB operations
- Validate user permissions before writes

### For Queries
- Use public views for safe data access
- Join through schedule for race context
- Filter by user_id for user-specific data
- Use split_position for division/split rankings

### For Security
- All user operations require authentication
- User data isolated by user_id matching
- Public views provide safe data exposure
- No direct table writes for core data