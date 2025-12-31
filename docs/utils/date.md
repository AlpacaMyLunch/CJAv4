# Date Formatting Utilities

Centralized date formatting functions for consistent date display across the application.

## Location

[src/utils/date.ts](date.ts)

## Available Functions

### `formatDate(date)`
Formats a date to a localized date string.
```tsx
formatDate('2024-01-15') // "1/15/2024" (en-US) or "15/1/2024" (en-GB)
formatDate(new Date())
```

### `formatShortDate(date)`
Formats a date to a short date string (e.g., "Jan 15").
```tsx
formatShortDate('2024-01-15') // "Jan 15"
```

### `formatDateLong(date)`
Formats a date to a long date string (e.g., "January 15, 2024").
```tsx
formatDateLong('2024-01-15') // "January 15, 2024"
```

### `formatTime(date)`
Formats a date to a localized time string.
```tsx
formatTime('2024-01-15T14:30:00') // "2:30:00 PM"
```

### `formatShortTime(date)`
Formats a date to a short time string without seconds.
```tsx
formatShortTime('2024-01-15T14:30:00') // "2:30 PM"
```

### `formatDateTime(date)`
Formats a date to include both date and time.
```tsx
formatDateTime('2024-01-15T14:30:00') // "1/15/2024 at 2:30:00 PM"
```

### `formatDateTimeShort(date)`
Formats a date to include date and short time (without seconds).
```tsx
formatDateTimeShort('2024-01-15T14:30:00') // "1/15/2024 at 2:30 PM"
```

### `formatRelativeTime(date)`
Formats a date relative to now (e.g., "2 days ago", "in 3 hours").
```tsx
formatRelativeTime('2024-01-13') // "2 days ago" (if today is Jan 15)
```

### Utility Functions

#### `isPast(date)`
Checks if a date is in the past.
```tsx
isPast('2020-01-01') // true
```

#### `isFuture(date)`
Checks if a date is in the future.
```tsx
isFuture('2030-01-01') // true
```

#### `isToday(date)`
Checks if a date is today.
```tsx
isToday(new Date()) // true
```

## Migration Summary

All date formatting has been migrated to use these centralized utilities:

### Files Updated (13 total)

#### Components (5 files)
1. ✅ [ShopReviewCard.tsx](../components/ShopReviewCard.tsx) - `formatDate()`
2. ✅ [AppReviewCard.tsx](../components/AppReviewCard.tsx) - `formatDate()`
3. ✅ [PastPicks.tsx](../components/PastPicks.tsx) - `formatDate()`
4. ✅ [RecommendationWizard.tsx](../components/RecommendationWizard.tsx) - `formatDate()` (2 instances)

#### Pages (8 files)
5. ✅ [CommunityPredictions.tsx](../pages/CommunityPredictions.tsx) - `formatDateTime()`
6. ✅ [NostradouglasUserResults.tsx](../pages/NostradouglasUserResults.tsx) - `formatShortDate()`
7. ✅ [NostradouglasLeaderboard.tsx](../pages/NostradouglasLeaderboard.tsx) - `formatShortDate()`
8. ✅ [AdminSetupShops.tsx](../pages/AdminSetupShops.tsx) - `formatDate()`
9. ✅ [AdminDashboard.tsx](../pages/AdminDashboard.tsx) - `formatDate()`
10. ✅ [Nostradouglas.tsx](../pages/Nostradouglas.tsx) - `formatDate()` (2 instances)

### Before/After Examples

#### Example 1: Basic Date Format
**Before:**
```tsx
{new Date(review.updated_at).toLocaleDateString()}
```

**After:**
```tsx
import { formatDate } from '@/utils/date'

{formatDate(review.updated_at)}
```

#### Example 2: Date with Time
**Before:**
```tsx
{`${deadline.toLocaleDateString()} at ${deadline.toLocaleTimeString()}`}
```

**After:**
```tsx
import { formatDateTime } from '@/utils/date'

{formatDateTime(deadline)}
```

#### Example 3: Short Date Format
**Before:**
```tsx
{new Date(scheduleItem.race_date).toLocaleDateString('en-US', {
  month: 'short',
  day: 'numeric'
})}
```

**After:**
```tsx
import { formatShortDate } from '@/utils/date'

{formatShortDate(scheduleItem.race_date)}
```

## Benefits

1. **Consistency**: All dates are formatted the same way across the application
2. **Maintainability**: Change the format in one place to update everywhere
3. **Type Safety**: All functions are fully typed with TypeScript
4. **Flexibility**: Easy to add new formatting options as needed
5. **Reusability**: Import and use anywhere in the application
6. **Locale Support**: Uses browser's locale settings for appropriate formatting

## Usage Guidelines

1. **Always use these utilities** instead of calling `.toLocaleDateString()` or `.toLocaleTimeString()` directly
2. **Choose the right function** for your use case:
   - User profile dates → `formatDate()`
   - Race schedules → `formatShortDate()`
   - Deadlines with time → `formatDateTime()` or `formatDateTimeShort()`
   - Review timestamps → `formatDate()`
3. **Import at the top** of your component file
4. **Test locale handling** if you modify the functions

## Adding New Formats

To add a new date format:

1. Add the function to `src/utils/date.ts`
2. Export it
3. Add JSDoc comments with examples
4. Update this README with the new function
5. Run `npx tsc --noEmit` to verify type safety

## TypeScript Support

All functions accept `string | Date | number` for maximum flexibility:

```tsx
formatDate('2024-01-15')           // String ISO date
formatDate(new Date())             // Date object
formatDate(1705334400000)          // Timestamp
```
