# Task: ACC Race Results Generator Page

Add a new page to the app that lets users reconstruct corrupted Assetto Corsa Competizione race result JSON files. The workflow: upload a qualifying JSON → reorder drivers via drag-and-drop to match actual finishing positions → edit per-driver timing → download a valid race result JSON.

## Context & Data Structures

ACC server results are JSON files with this structure (relevant fields):

```json
{
  "laps": [
    { "carId": 1010, "driverIndex": 0, "isValidForBest": true, "laptime": 101552, "splits": [31190, 40220, 30142] }
  ],
  "penalties": [],
  "post_race_penalties": null,
  "sessionIndex": 2,
  "raceWeekendIndex": 0,
  "sessionResult": {
    "bestSplits": [30720, 39887, 29790],
    "bestlap": 100397,
    "isWetSession": 0,
    "type": 1,
    "leaderBoardLines": [
      {
        "car": {
          "carId": 1023,
          "carModel": 36,
          "carGroup": "GT3",
          "carGuid": -1,
          "teamGuid": -1,
          "cupCategory": 0,
          "drivers": [
            { "firstName": "Ian", "lastName": "Kreigar", "playerId": "S76561198801418760", "shortName": "KRE" }
          ],
          "nationality": 0,
          "raceNumber": 706,
          "teamName": ""
        },
        "currentDriver": { "firstName": "Ian", "lastName": "Kreigar", "playerId": "S76561198801418760", "shortName": "KRE" },
        "currentDriverIndex": 0,
        "driverTotalTimes": [1343438],
        "missingMandatoryPitstop": 0,
        "timing": {
          "bestLap": 100397,
          "bestSplits": [30720, 39887, 29790],
          "lapCount": 30,
          "lastLap": 100887,
          "lastSplitId": 0,
          "lastSplits": [30775, 40167, 29945],
          "totalTime": 3024960
        }
      }
    ]
  },
  "sessionType": "R",
  "trackName": "kyalami_2022",
  "serverName": "Server Name",
  "metaData": "",
  "Date": "2025-03-15T02:00:00Z",
  "SessionFile": "250315_010000_R"
}
```

All timing values are in **milliseconds**. Splits are 3 sectors that sum to the lap time.

## Workflow

### Step 1 — Upload Qualifying JSON

- File input accepts a `.json` file.
- Parse and validate it (must have `sessionResult.leaderBoardLines` with driver entries).
- Extract driver list: for each `leaderBoardLines` entry, display `firstName lastName`, `raceNumber`, `shortName`, `playerId`. Preserve all car metadata (carId, carModel, carGroup, nationality, etc.) — it gets carried into the race result.
- Advance to Step 2.

### Step 2 — Configure Grid

- Display all drivers in a **drag-and-drop sortable list**. Each row shows position number, driver name, and race number.
- Users drag drivers into correct finishing order (P1 at top, last place at bottom).
- Each driver row has:
  - **Lap Count** — integer input, default 30.
  - **Total Time (ms)** — integer input.
  - **Best Lap (ms)** — integer input. This will also be used as `lastLap`.
  - **Sector 1, Sector 2, Sector 3 (ms)** — integer inputs. Used as both `bestSplits` and `lastSplits`.
- A **checkbox or toggle per driver** to exclude them from the final result (for DNFs/disconnected drivers who shouldn't appear).
- Display a running calculation: `S1 + S2 + S3` next to best lap so users can see if sectors sum correctly.
- A helpful display showing the current session-level `bestLap` and `bestSplits` (auto-calculated as the minimum bestLap across all included drivers, and minimum of each sector across all included drivers).

### Step 3 — Generate & Download

A "Generate Race Result" button that:

1. Deep copies the uploaded qualifying data as the base.
2. Sets session-level fields:
   - `sessionIndex`: 2
   - `sessionType`: `"R"`
   - `sessionResult.type`: 1
   - `penalties`: `[]` (empty array)
   - `post_race_penalties`: `null`
   - `sessionResult.isWetSession`: carry from qual
3. Modifies `SessionFile`: split by `_`, increment the middle number by 1, replace trailing `Q` with `R`.
4. Modifies `Date`: parse the ISO date string, add 1 hour, re-format.
5. Builds `sessionResult.bestlap` and `sessionResult.bestSplits` from the minimums across all included drivers.
6. Builds `sessionResult.leaderBoardLines` in the user's drag-and-drop order (excluded drivers omitted). For each entry:
   - Carry all `car` metadata and `currentDriver` from the qualifying entry (matched by `playerId`).
   - `currentDriverIndex`: 0
   - `driverTotalTimes`: `[totalTime]` (single-element array using the user-entered total time)
   - `missingMandatoryPitstop`: 0
   - `timing.bestLap`: user-entered bestLap
   - `timing.bestSplits`: `[S1, S2, S3]` from user input
   - `timing.lastLap`: same as bestLap
   - `timing.lastSplits`: same as bestSplits
   - `timing.lastSplitId`: 0
   - `timing.lapCount`: user-entered lap count
   - `timing.totalTime`: user-entered total time
7. Builds the `laps` array: for each included driver, generate `lapCount` identical lap entries:
   ```json
   { "carId": "<from car metadata>", "driverIndex": 0, "isValidForBest": true, "laptime": "<bestLap>", "splits": ["<S1>", "<S2>", "<S3>"] }
   ```
   Laps should be ordered: all of lap 1 for every driver (in finishing order), then all of lap 2, etc. — interleaved by lap number just like a real results file.
8. Trigger a JSON file download. Filename format: `D2_Race_Results.json` (or derive the prefix from the uploaded filename).

## Technical Notes

- This is a Nuxt 3 SPA with Vue 3 Composition API. Use `<script setup>` syntax.
- For drag-and-drop, use `vuedraggable` (the Vue 3 compatible version: `vuedraggable@next` / `zhyswan-vuedraggable` if needed). If already in the project dependencies, use that. Otherwise add it.
- Keep all logic in a single page component. If it gets large, extract composables for the JSON transformation logic.
- match the existing app's styling conventions.
- All timing inputs should be number fields working in milliseconds. Optionally display a human-readable `m:ss.xxx` format next to each ms input as a convenience label.
- No backend needed — everything happens client-side. File reading via FileReader API, download via Blob URL.