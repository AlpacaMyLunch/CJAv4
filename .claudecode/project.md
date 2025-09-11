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













# Sim Racing Database Schema - Complete Technical Reference

## Database Overview
PostgreSQL database for sim racing league management with seasons, drivers, tracks, schedules, race results, and user predictions. Supports multi-division racing with comprehensive Row Level Security (RLS). Currently managing Season 16 with 8-week schedule across 6 divisions and 2 splits.

## Database Objects Summary
- **8 Tables**: Core data storage with full RLS
- **3 Views**: Public data access layers
- **External**: auth.users (Supabase Auth integration)

## Architecture & Data Flow

```
Users (auth.users)
├── predictions (race winner predictions)
├── nostradouglas (schedule predictions)
└── 
    seasons → schedule → race_results
              ↓           ↑
           tracks ←─ track_name_lookup
              ↑
           drivers
```

## Complete Table Specifications

### `seasons` - Season Management
Core season definitions with one record per actual racing season.

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

**Access Control**: Read-only for authenticated users  
**Current Data**: Season 16 "GT3 Team Series", prediction deadline 2025-11-01, starts 2025-11-05  
**Business Logic**: Season number must be unique, prediction deadline enforced

---

### `tracks` - Racing Circuit Registry
Master list of available racing tracks/circuits.

```sql
CREATE TABLE tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE
);
```

**Access Control**: Public read access  
**Current Data**: 25 tracks including Monza, Spa-Francochamps, Nürburgring, Silverstone, Barcelona, Paul Ricard, Laguna Seca, etc.  
**Business Logic**: Track names must be unique and canonical

---

### `track_name_lookup` - Name Normalization System
Maps track name variations to canonical track names for data consistency.

```sql
CREATE TABLE track_name_lookup (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variation VARCHAR(255) NOT NULL UNIQUE,
    canonical_track_name VARCHAR(255) NOT NULL REFERENCES tracks(name) ON UPDATE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Access Control**: Read-only for all users (public + authenticated)  
**Purpose**: Handles variations like "Nurburgring" → "Nürburgring", "COTA" → "Circuit of the Americas"  
**Usage**: Essential for parsing external data sources with inconsistent track naming

---

### `drivers` - Driver Registry & Profiles
Complete driver information with current division/split assignments.

```sql
CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    steam_id_sha256 VARCHAR(64) NOT NULL UNIQUE,  -- Identity source of truth
    discord_id VARCHAR(32) UNIQUE,
    discord_username VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    short_name VARCHAR(50) NOT NULL,
    division INTEGER NOT NULL CHECK (division >= 1 AND division <= 6),
    division_split VARCHAR(10) NOT NULL CHECK (division_split IN ('Gold', 'Silver')),
    driver_number INTEGER UNIQUE,  -- Racing number
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Access Control**: Read-only for authenticated users  
**Identity Management**: steam_id_sha256 is the source of truth for all driver operations  
**Current Data**: 24 active drivers distributed across 6 divisions × 2 splits  
**Business Logic**: Driver numbers must be unique, divisions 1-6, splits Gold/Silver only

---

### `schedule` - Race Calendar Management
Links seasons to tracks by race week, defining the racing calendar.

```sql
CREATE TABLE schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    week INTEGER NOT NULL CHECK (week >= 1 AND week <= 8),
    track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    race_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(season_id, week),      -- One track per week per season
    UNIQUE(season_id, track_id)   -- Each track appears once per season
);
```

**Access Control**: Read-only for authenticated users  
**Current Schedule (Season 16)**:
1. Week 1: Paul Ricard (Nov 5)
2. Week 2: Nürburgring (Nov 12)  
3. Week 3: Barcelona (Nov 19)
4. Week 4: Donington Park (Nov 26)
5. Week 5: Hungaroring (Dec 3)
6. Week 6: Laguna Seca (Dec 10)
7. Week 7: Kyalami (Dec 17)
8. Week 8: Monza (Dec 24)

---

### `race_results` - Actual Race Outcomes
Stores actual race results with historical division/split preservation.

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
    UNIQUE(schedule_id, division, split, driver_id),        -- One result per driver per race
    UNIQUE(schedule_id, division, split, finish_position)   -- One driver per position per race
);
```

**Access Control**: Read-only for authenticated users  
**Critical Rule**: Division/split values are preserved from race time and never updated, only finish_position can be modified  
**Business Logic**: Maintains historical accuracy even if drivers change divisions mid-season

---

### `predictions` - Race Winner Predictions
Users predict race winners by division and split for each scheduled race.

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
    UNIQUE(user_id, schedule_id, division, split)  -- One prediction per user per race per division/split
);
```

**Access Control**: Users can only read/write their own predictions (auth.uid() = user_id)  
**Purpose**: Users predict which driver will win each race in each division/split combination  
**Business Logic**: One prediction per user per race per division/split, can be updated until prediction deadline

---

### `nostradouglas` - Schedule Predictions
Users predict the upcoming season's race schedule before it's officially announced.

```sql
CREATE TABLE nostradouglas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    season_id UUID REFERENCES seasons(id) ON DELETE CASCADE,
    track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
    position INTEGER NOT NULL CHECK (position >= 1 AND position <= 8),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, season_id, position),  -- One track per position per user per season
    UNIQUE(user_id, season_id, track_id)   -- Each track appears once per user per season
);
```

**Access Control**: Users can only read/write their own predictions (auth.uid() = user_id)  
**Purpose**: Users predict which tracks will be selected for weeks 1-8 of the season schedule  
**Business Logic**: Each user predicts 8 tracks in order (positions 1-8), no duplicates allowed

## Public Views

### `drivers_public` - Safe Driver Information
Public subset of driver data without sensitive information.

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

**Access**: Public (anonymous + authenticated)  
**Usage**: Safe for public leaderboards, driver listings

---

### `race_results_public` - Enhanced Race Results
Complete race results with driver names, track info, and split-specific positioning.

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
    rr.finish_position,  -- Overall race finishing position
    ROW_NUMBER() OVER (
        PARTITION BY rr.schedule_id, rr.division, rr.split 
        ORDER BY rr.finish_position
    ) AS split_position,  -- Position within specific division/split
    rr.created_at,
    rr.updated_at
FROM race_results rr
JOIN drivers d ON d.id = rr.driver_id
JOIN schedule s ON s.id = rr.schedule_id
JOIN tracks t ON t.id = s.track_id
ORDER BY s.week, rr.division, rr.split, rr.finish_position;
```

**Access**: Public  
**Key Feature**: `split_position` shows ranking within division/split (e.g., 1st place Division 1 Silver finisher)  
**Usage**: Public race results, championship standings

---

### `user_profiles_public` - User Display Information
Safe user profile data from Supabase Auth for public display.

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

**Access**: Public  
**Usage**: User identification in leaderboards, prediction displays

## Security & Access Control (RLS Policies)

### Write Permissions
Only user-owned prediction data can be modified:

```sql
-- Users manage their own race winner predictions
CREATE POLICY predictions_user_access ON predictions
USING (auth.uid() = user_id);

-- Users manage their own schedule predictions  
CREATE POLICY nostradouglas_user_access ON nostradouglas
USING (auth.uid() = user_id);
```

### Read Permissions by Access Level

**Public Access (Anonymous + Authenticated)**:
- `tracks` - All racing circuits
- `drivers_public` - Safe driver info
- `race_results_public` - Complete race results
- `user_profiles_public` - User display names
- `track_name_lookup` - Track name variations

**Authenticated Only**:
- `seasons` - Season definitions
- `schedule` - Race calendar
- `race_results` - Raw race results
- `drivers` - Complete driver profiles

**User-Specific**:
- `predictions` - Own race winner predictions only
- `nostradouglas` - Own schedule predictions only

### No Write Access
Core data tables are read-only for all users:
- `seasons`, `drivers`, `tracks`, `schedule`, `race_results`, `track_name_lookup`

## Application Development Patterns

### Driver Identity Management
```python
# Always use steam_id_sha256 as the source of truth
def upsert_driver(driver_data):
    # steam_id_sha256 is required and immutable
    # Other fields can be updated
    return supabase.table('drivers').upsert(driver_data).execute()
```

### Track Name Normalization
```python
def normalize_track_name(input_name):
    # 1. Try exact match in tracks table
    # 2. Check track_name_lookup for variations
    # 3. Return original if no match found
    # Essential for parsing external race data
```

### Race Results Processing
```python
def update_race_result(schedule_id, driver_id, new_position):
    # NEVER update division/split on existing records
    # Only update finish_position to preserve historical accuracy
    # Division/split locked at race time
```

### User Predictions
```python
def create_prediction(user_id, schedule_id, division, split, driver_id):
    # Enforce one prediction per user per race per division/split
    # Users can only access their own predictions
    # Must respect prediction deadlines
```

## Data Integrity & Business Rules

### Critical Constraints
- **Driver Identity**: steam_id_sha256 uniqueness enforced
- **Race Results**: Historical division/split preservation
- **Predictions**: One per user per race per division/split
- **Schedule**: No duplicate tracks per season, 8 weeks maximum

### Validation Rules
- Divisions: 1-6 range only
- Splits: 'Gold' or 'Silver' only  
- Weeks: 1-8 range for schedule
- Positions: Must be positive integers
- Driver numbers: Unique across all drivers

### Cascading Operations
- Deleting seasons → removes schedule, results, predictions
- Deleting drivers → removes results, predictions
- Deleting tracks → removes schedule entries
- User deletion → removes all user predictions

## Current System State

### Active Data
- **Season 16**: "GT3 Team Series" with 8-week schedule
- **24 Drivers**: Active across 6 divisions × 2 splits
- **25 Tracks**: Available for scheduling
- **Complete Schedule**: Paul Ricard through Monza

### Operational Status
- Prediction system active for race winners
- Schedule prediction system ready for future seasons
- Race results processing capable
- Full RLS security implemented

## Development Guidelines

### For Data Operations
1. Use steam_id_sha256 for all driver identification
2. Preserve historical race result division/split values
3. Normalize track names before database operations
4. Validate user permissions before any writes
5. Use public views for safe data access

### For Queries
1. Join through schedule table for race context
2. Use split_position for division/split rankings
3. Filter by user_id for user-specific data
4. Leverage public views to avoid permission issues

### For Security
1. All user operations require authentication
2. User data strictly isolated by user_id matching
3. Use public views for safe data exposure
4. Never allow direct writes to core data tables

This schema supports a complete sim racing league management system with robust security, data integrity, and multiple prediction systems for enhanced user engagement.