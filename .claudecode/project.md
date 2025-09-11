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
PostgreSQL database for comprehensive sim racing league management featuring seasons, drivers, tracks, schedules, race results, predictions, and administration. Supports multi-division racing (1-6) with dual splits (Gold/Silver) and comprehensive Row Level Security. Currently managing Season 16 with active 8-week racing schedule.

## Database Objects Summary
- **9 Tables**: Core data storage with full RLS implementation
- **6 Views**: Public data access + admin management layers
- **External**: auth.users (Supabase Auth integration)
- **Security**: Granular RLS policies for anonymous, authenticated, and admin access

## Architecture & Data Relationships

```
auth.users (Supabase Auth)
├── admins (admin privileges)
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
Master season registry with one record per actual racing season.

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

**Access Control**: Public read access (anonymous + authenticated)  
**Current Data**: Season 16 "GT3 Team Series", prediction deadline 2025-11-01, starts 2025-11-05  
**Business Logic**: Season numbers must be unique, prediction deadlines enforced

---

### `tracks` - Racing Circuit Registry
Master list of available racing tracks and circuits.

```sql
CREATE TABLE tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE
);
```

**Access Control**: Public read access (anonymous + authenticated)  
**Current Data**: 25 tracks including Monza, Spa-Francochamps, Nürburgring, Silverstone, Barcelona, Paul Ricard, Laguna Seca, Kyalami, etc.  
**Business Logic**: Track names must be unique and canonical

---

### `track_name_lookup` - Name Normalization System
Maps track name variations and aliases to canonical track names for data consistency.

```sql
CREATE TABLE track_name_lookup (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variation VARCHAR(255) NOT NULL UNIQUE,
    canonical_track_name VARCHAR(255) NOT NULL REFERENCES tracks(name) ON UPDATE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Access Control**: Public read access (anonymous + authenticated)  
**Purpose**: Handles variations like "Nurburgring" → "Nürburgring", "COTA" → "Circuit of the Americas", "Spa" → "Spa-Francochamps"  
**Usage**: Essential for parsing external data sources with inconsistent track naming conventions

---

### `drivers` - Driver Registry & Profiles
Complete driver information with current division/split assignments and contact details.

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

**Access Control**: Public read access (anonymous + authenticated)  
**Identity Management**: steam_id_sha256 is the source of truth for all driver operations  
**Current Data**: 24 active drivers distributed across 6 divisions × 2 splits  
**Business Logic**: Driver numbers must be unique, divisions 1-6, splits Gold/Silver only, steam_id_sha256 immutable

---

### `schedule` - Race Calendar Management
Links seasons to tracks by race week, defining the official racing calendar.

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

**Access Control**: Authenticated users only  
**Current Schedule (Season 16)**:
1. Week 1: Paul Ricard (Nov 5, 2025)
2. Week 2: Nürburgring (Nov 12, 2025)  
3. Week 3: Barcelona (Nov 19, 2025)
4. Week 4: Donington Park (Nov 26, 2025)
5. Week 5: Hungaroring (Dec 3, 2025)
6. Week 6: Laguna Seca (Dec 10, 2025)
7. Week 7: Kyalami (Dec 17, 2025)
8. Week 8: Monza (Dec 24, 2025)

---

### `race_results` - Actual Race Outcomes
Stores actual race results with historical division/split preservation for data integrity.

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

**Access Control**: Authenticated users only  
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
Users predict the upcoming season's race schedule before official announcement.

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

---

### `admins` - Administrative Privileges
Defines which users have administrative access to the system.

```sql
CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'admin',
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    granted_by UUID REFERENCES auth.users(id)
);
```

**Access Control**: Read-only for authenticated users  
**Current Data**: michael.jeffries@gmail.com (system administrator)  
**Business Logic**: One admin record per user, cascading delete on user removal

## Public Views

### `drivers_public` - Safe Driver Information
Public subset of driver data without sensitive information like Steam IDs.

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
**Usage**: Safe for public leaderboards, driver listings, team displays

---

### `race_results_public` - Enhanced Race Results
Complete race results with driver names, track information, and split-specific positioning.

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
**Key Feature**: `split_position` shows ranking within division/split (e.g., 1st place Division 1 Silver finisher gets split_position = 1)  
**Usage**: Public race results, championship standings, leaderboards

---

### `user_profiles_public` - User Display Information
Safe user profile data from Supabase Auth for public identification.

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
**Usage**: User identification in leaderboards, prediction displays, public forums

## Admin-Only Views

### `admin_users_view` - Complete User Management
Full user data from Supabase Auth with admin status for user management.

```sql
CREATE VIEW admin_users_view AS
SELECT 
    u.id,
    u.email,
    u.phone,
    u.created_at,
    u.last_sign_in_at,
    u.confirmed_at,
    u.email_confirmed_at,
    u.raw_user_meta_data,
    COALESCE(
        u.raw_user_meta_data->>'full_name',
        u.email::text,
        'Anonymous'
    ) AS display_name,
    CASE WHEN a.user_id IS NOT NULL THEN true ELSE false END AS is_admin
FROM auth.users u
LEFT JOIN admins a ON u.id = a.user_id;
```

**Access**: Authenticated users (application must verify admin status)  
**Usage**: Admin dashboard user management, user verification, admin assignment

---

### `admin_nostradouglas_view` - All Schedule Predictions
Complete view of all user schedule predictions with user and context information.

```sql
CREATE VIEW admin_nostradouglas_view AS
SELECT 
    n.id,
    n.user_id,
    COALESCE(
        u.raw_user_meta_data->>'full_name',
        u.email::text,
        'Anonymous'
    ) AS user_display_name,
    u.email AS user_email,
    n.season_id,
    s.season_number,
    s.name AS season_name,
    n.track_id,
    t.name AS track_name,
    n.position,
    n.created_at,
    n.updated_at
FROM nostradouglas n
JOIN auth.users u ON n.user_id = u.id
JOIN seasons s ON n.season_id = s.id
JOIN tracks t ON n.track_id = t.id
ORDER BY s.season_number, u.email, n.position;
```

**Access**: Authenticated users (application must verify admin status)  
**Usage**: Admin review of schedule predictions, prediction analysis, user engagement tracking

---

### `admin_predictions_view` - All Race Winner Predictions
Complete view of all user race winner predictions with full context.

```sql
CREATE VIEW admin_predictions_view AS
SELECT 
    p.id,
    p.user_id,
    COALESCE(
        u.raw_user_meta_data->>'full_name',
        u.email::text,
        'Anonymous'
    ) AS user_display_name,
    u.email AS user_email,
    p.schedule_id,
    sc.week,
    t.name AS track_name,
    sc.race_date,
    s.season_number,
    s.name AS season_name,
    p.division,
    p.split,
    p.driver_id,
    d.short_name AS driver_name,
    d.driver_number,
    d.first_name AS driver_first_name,
    d.last_name AS driver_last_name,
    p.created_at,
    p.updated_at
FROM predictions p
JOIN auth.users u ON p.user_id = u.id
JOIN schedule sc ON p.schedule_id = sc.id
JOIN seasons s ON sc.season_id = s.id
JOIN tracks t ON sc.track_id = t.id
JOIN drivers d ON p.driver_id = d.id
ORDER BY s.season_number, sc.week, p.division, p.split, u.email;
```

**Access**: Authenticated users (application must verify admin status)  
**Usage**: Admin prediction analysis, scoring calculations, user engagement metrics

## Security & Access Control (RLS Policies)

### Public Access (Anonymous + Authenticated)
Complete read access without authentication required:

```sql
-- Core league data
seasons, tracks, track_name_lookup

-- Driver information (via direct table and view)
drivers, drivers_public

-- Race results with enhanced data
race_results_public

-- User identification
user_profiles_public
```

### Authenticated User Access
Additional read access for logged-in users:

```sql
-- Race management
schedule, race_results

-- Administrative information
admins

-- Admin views (must verify admin status in application)
admin_users_view, admin_nostradouglas_view, admin_predictions_view
```

### User-Specific Access (Own Data Only)
Users can read and write only their own records:

```sql
-- Race winner predictions
predictions (WHERE auth.uid() = user_id)

-- Schedule predictions  
nostradouglas (WHERE auth.uid() = user_id)
```

### Administrative Access Verification
```python
def is_user_admin(supabase: Client, user_id: str) -> bool:
    """Verify admin status before accessing admin views"""
    result = supabase.table('admins').select('user_id').eq('user_id', user_id).execute()
    return len(result.data) > 0

def require_admin_access(supabase: Client):
    """Ensure user is admin before accessing admin data"""
    user = supabase.auth.get_user()
    if not user.user or not is_user_admin(supabase, user.user.id):
        raise PermissionError("Admin access required")
```

### No Write Access
Core data tables are read-only for all users (modifications via admin tools only):
- `seasons`, `drivers`, `tracks`, `schedule`, `race_results`, `track_name_lookup`, `admins`

## Application Development Patterns

### Admin Data Access
```python
def get_admin_data(supabase: Client, view_name: str):
    """Access admin views with proper verification"""
    require_admin_access(supabase)
    return supabase.table(view_name).select('*').execute()

# Usage examples
users_data = get_admin_data(supabase, 'admin_users_view')
schedule_predictions = get_admin_data(supabase, 'admin_nostradouglas_view')
race_predictions = get_admin_data(supabase, 'admin_predictions_view')
```

### Driver Identity Management
```python
def upsert_driver(driver_data):
    """Always use steam_id_sha256 as the source of truth"""
    return supabase.table('drivers').upsert(driver_data).execute()
```

### Track Name Normalization
```python
def normalize_track_name(input_name):
    """Essential for parsing external race data"""
    # 1. Try exact match in tracks table
    # 2. Check track_name_lookup for variations
    # 3. Return original if no match found
```

### Race Results Processing
```python
def update_race_result(schedule_id, driver_id, new_position):
    """Preserve historical accuracy"""
    # NEVER update division/split on existing records
    # Only update finish_position to preserve historical accuracy
```

### User Predictions
```python
def create_prediction(user_id, schedule_id, division, split, driver_id):
    """Enforce prediction rules"""
    # Enforce one prediction per user per race per division/split
    # Users can only access their own predictions
```

## Data Integrity & Business Rules

### Critical Constraints
- **Driver Identity**: steam_id_sha256 uniqueness enforced across all operations
- **Race Results**: Historical division/split preservation maintains data integrity
- **Predictions**: One per user per race per division/split prevents gaming
- **Schedule**: No duplicate tracks per season, maximum 8 weeks
- **Admin Access**: Manual management only, no automated privilege escalation

### Validation Rules
- **Divisions**: 1-6 range only, enforced at database level
- **Splits**: 'Gold' or 'Silver' only, case-sensitive
- **Weeks**: 1-8 range for schedule entries
- **Positions**: Must be positive integers
- **Driver Numbers**: Unique across all active drivers
- **Track Names**: Must exist in tracks table for schedule entries

### Cascading Operations
- **User Deletion**: Removes all user predictions, preserves race results
- **Season Deletion**: Removes schedule, results, and predictions
- **Driver Deletion**: Removes results and predictions
- **Track Deletion**: Removes schedule entries and results

## Current System State

### Active Data
- **Season 16**: "GT3 Team Series" with complete 8-week schedule
- **24 Active Drivers**: Distributed across 6 divisions × 2 splits
- **25 Available Tracks**: Full sim racing circuit library
- **Complete Schedule**: Paul Ricard (Week 1) through Monza (Week 8)
- **1 Admin User**: michael.jeffries@gmail.com

### Operational Status
- ✅ Race winner prediction system active
- ✅ Schedule prediction system ready for future seasons
- ✅ Race results processing capability implemented
- ✅ Full RLS security with public access layers
- ✅ Admin management system operational with comprehensive views

## Development Guidelines

### For Admin Interface Development
1. **Access Verification**: Always verify admin status before accessing admin views
2. **Data Security**: Admin views contain sensitive user data - handle appropriately
3. **User Management**: Use admin_users_view for comprehensive user administration
4. **Prediction Analysis**: Leverage admin prediction views for scoring and analytics
5. **Audit Trails**: Track admin actions for security and compliance

### For Data Operations
1. **Driver Management**: Use steam_id_sha256 for all driver identification and operations
2. **Historical Integrity**: Preserve race result division/split values, never modify
3. **Track Normalization**: Always normalize track names before database operations
4. **Permission Validation**: Validate user permissions before any write operations
5. **Public Safety**: Use public views for all public-facing data access

### For Query Optimization
1. **Admin Views**: Pre-joined data reduces query complexity for admin interfaces
2. **Race Context**: Join through schedule table for complete race information
3. **Split Rankings**: Use split_position from race_results_public for rankings
4. **User Isolation**: Filter by user_id for all user-specific data access
5. **Public Views**: Leverage public views to avoid RLS permission complexity

### For Security Implementation
1. **Authentication**: All user operations require valid Supabase authentication
2. **Admin Verification**: Check admins table before accessing sensitive data
3. **Data Isolation**: User data strictly isolated by user_id matching
4. **Safe Exposure**: Use public views for all anonymous/public data access
5. **Write Protection**: Never allow direct writes to core data tables

This comprehensive schema supports a complete sim racing league management system with robust security, data integrity, multiple prediction systems, administrative controls, and comprehensive admin oversight capabilities for enhanced user engagement and operational management.