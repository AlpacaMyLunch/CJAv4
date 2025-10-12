# Nostradouglas Results Database Views - Implementation Guide

## Available Views

### `nostradouglas_leaderboard`
Aggregated scores for all participants in a season.

**Columns:**
- `user_id` (uuid) - User identifier
- `display_name` (text) - Discord display name
- `season_id` (uuid) - Season identifier
- `season_name` (text) - Season name
- `season_number` (int) - Season number
- `total_points` (int) - Combined score (0-16 possible)
- `track_points` (int) - Points for correct tracks (0-8)
- `week_points` (int) - Points for correct week placements (0-8)
- `predictions_made` (int) - Number of predictions submitted
- `rank` (int) - Ranking within the season (ties possible, next rank skips)

### `nostradouglas_detailed_results`
Individual prediction breakdown with scoring details.

**Columns:**
- `user_id` (uuid) - User identifier
- `display_name` (text) - Discord display name
- `season_id` (uuid) - Season identifier
- `season_name` (text) - Season name
- `predicted_week` (int) - Week position they predicted (1-8)
- `predicted_track` (text) - Track name they predicted
- `actual_week` (int|null) - Actual week the track appears in schedule (null if not in schedule)
- `track_match_points` (int) - 1 if track is in schedule, 0 otherwise
- `week_match_points` (int) - 1 if track is in correct week, 0 otherwise
- `prediction_points` (int) - Total points for this prediction (0-2)
- `status` (text) - "Perfect Match" | "Track Match Only" | "No Match"

## Scoring Rules
- 1 point for predicting a track that appears in the schedule (any week)
- 1 additional point for predicting the track in the correct week
- Maximum 2 points per prediction, 16 points total per season

## Individual Participant Statistics Page

**Route:** `/nostradouglas/{seasonId}/user/{userId}`

**Queries:**
```sql
-- Get user summary and rank
SELECT rank, total_points, track_points, week_points, display_name
FROM nostradouglas_leaderboard
WHERE season_id = $seasonId AND user_id = $userId;

-- Get detailed predictions
SELECT predicted_week, predicted_track, actual_week, prediction_points, status
FROM nostradouglas_detailed_results
WHERE season_id = $seasonId AND user_id = $userId
ORDER BY predicted_week;

-- Get correct schedule (answer key)
SELECT week, name as track_name
FROM schedule s
JOIN tracks t ON s.track_id = t.id
WHERE season_id = $seasonId
ORDER BY week;


Display Structure:
Header:
- Display name
- Total points with breakdown (e.g., "11 points (7 tracks, 4 weeks)")
- Rank (e.g., "Rank #1")

Predictions Table (8 rows):
Week | Predicted Track | Actual Week | Points | Status
-----|-----------------|-------------|--------|------------------
  1  | Silverstone     |      1      |   2    | Perfect Match
  2  | Valencia        |      3      |   1    | Track Match Only
  3  | Laguna Seca     |    null     |   0    | No Match
  4  | Zandvoort       |      4      |   2    | Perfect Match
  ... (8 total rows)

Answer Key Panel:
Week 1: Silverstone
Week 2: Circuit of the Americas
... (8 total weeks)



UI Recommendations:

Color coding: Green (Perfect Match), Yellow (Track Match Only), Red/Gray (No Match)
Show "Not in schedule" when actual_week is null
Highlight correct predictions visually
Show breakdown text: "7/8 tracks correct, 4/8 weeks correct"

Overall Results/Leaderboard Page
Route: /nostradouglas/{seasonId}
Queries:
sql-- Get all participants ranked
SELECT rank, display_name, total_points, track_points, week_points, predictions_made, user_id
FROM nostradouglas_leaderboard
WHERE season_id = $seasonId
ORDER BY rank;

-- Get season info
SELECT season_number, name, starts_at
FROM seasons
WHERE id = $seasonId;

-- Get correct schedule (answer key)
SELECT week, name as track_name, race_date
FROM schedule s
JOIN tracks t ON s.track_id = t.id
WHERE season_id = $seasonId
ORDER BY week;
Display Structure:
Header:
- Season name and number
- Summary stats:
  - Total participants
  - Highest score
  - Average score

Leaderboard Table:
Rank | Participant    | Total | Tracks | Weeks | Predictions
-----|----------------|-------|--------|-------|-------------
  1  | panzaroni      |  11   |   7    |   4   |      8
  2  | Drizzletheguy  |   9   |   6    |   3   |      7
  2  | rusha21        |   9   |   7    |   2   |      8
  4  | Macknificent   |   8   |   7    |   1   |      8

Answer Key Panel:
Week 1: Silverstone (Oct 13)
Week 2: Circuit of the Americas (Oct 20)
... (8 total weeks)
UI Recommendations:

Make rows clickable to navigate to individual participant page
Highlight ties in rank (visual indicator for same rank)
Add sort/filter options (by different columns)
Show answer key as reference panel
Link to individual stats pages via user_id

Implementation Notes

Ties: Multiple users can share the same rank. Rankings skip after ties (1, 2, 2, 4...).
Incomplete Predictions: Some users may have predictions_made < 8. Display accordingly.
Season Context: Always filter by season_id. Get current season:

sql   SELECT id, season_number, name 
   FROM seasons 
   ORDER BY created_at DESC 
   LIMIT 1;

Permissions: Views are readable by authenticated and anon roles.
Real-time: Views auto-update when schedule changes. No caching needed.
Navigation: Provide breadcrumbs and season selector dropdown.

Routing Pattern
/nostradouglas/{seasonId}                → Overall leaderboard
/nostradouglas/{seasonId}/user/{userId}  → Individual results
Related Tables (for reference)

seasons - Season information
schedule - Actual track schedule per season
tracks - Track names
nostradouglas - Raw prediction data
auth.users - User authentication data (for display_name)