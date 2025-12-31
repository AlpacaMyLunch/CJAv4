# useSupabaseQuery & useSupabaseMutation

Generic hooks for handling Supabase queries and mutations with automatic loading, error handling, and toast notifications.

## Overview

These hooks eliminate the boilerplate code commonly found in Supabase data fetching:

- ✅ Automatic loading state management
- ✅ Automatic error handling
- ✅ Optional error/success toast notifications
- ✅ Refetch capability
- ✅ Type-safe with generics
- ✅ Callback support (onSuccess, onError, onSettled)
- ✅ Conditional query execution

## Installation

These hooks are already available in `src/hooks/`:
- `useSupabaseQuery.ts` - For data fetching
- `useSupabaseMutation.ts` - For create/update/delete operations

## useSupabaseQuery

### Basic Usage

```tsx
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { supabase, type Season } from '@/lib/supabase'

function MyComponent() {
  const { data, loading, error, refetch } = useSupabaseQuery<Season>({
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seasons')
        .select('*')
        .order('season_number', { ascending: false })
        .limit(1)

      if (error) throw new Error(`Failed to fetch season: ${error.message}`)
      if (!data || data.length === 0) throw new Error('No season found')

      return data[0]
    },
    deps: [],
    showErrorToast: true
  })

  if (loading) return <LoadingSpinner />
  if (error) return <div>Error: {error}</div>

  return <div>{data?.name}</div>
}
```

### API Reference

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `queryFn` | `() => Promise<T>` | **Required** | The query function to execute |
| `deps` | `DependencyList` | `[]` | Dependencies that trigger refetch |
| `showErrorToast` | `boolean` | `true` | Show error toast on failure |
| `enabled` | `boolean` | `true` | Whether to execute query on mount |
| `errorMessage` | `string` | `undefined` | Custom error toast message |
| `onSuccess` | `(data: T) => void` | `undefined` | Callback on success |
| `onError` | `(error: Error) => void` | `undefined` | Callback on error |

#### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `data` | `T \| null` | The fetched data |
| `loading` | `boolean` | Loading state |
| `error` | `string \| null` | Error message |
| `refetch` | `() => Promise<void>` | Manually refetch data |

### Advanced Examples

#### Multiple Queries

```tsx
function useSeasonData() {
  const { data: season, loading: seasonLoading } = useSupabaseQuery<Season>({
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seasons')
        .select('*')
        .order('season_number', { ascending: false })
        .limit(1)

      if (error) throw new Error(`Failed to fetch season: ${error.message}`)
      return data[0]
    },
    deps: []
  })

  const { data: tracks, loading: tracksLoading } = useSupabaseQuery<Track[]>({
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tracks')
        .select('*')
        .order('name')

      if (error) throw new Error(`Failed to fetch tracks: ${error.message}`)
      return data || []
    },
    deps: []
  })

  return {
    season,
    tracks,
    loading: seasonLoading || tracksLoading
  }
}
```

#### Conditional Query (enabled option)

```tsx
function useUserPredictions(userId: string | null) {
  const { data, loading, error } = useSupabaseQuery<Prediction[]>({
    queryFn: async () => {
      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .eq('user_id', userId)

      if (error) throw new Error(`Failed to fetch predictions: ${error.message}`)
      return data || []
    },
    deps: [userId],
    enabled: !!userId, // Only fetch when userId exists
    showErrorToast: true
  })

  return { data, loading, error }
}
```

#### With Callbacks

```tsx
const { data, loading } = useSupabaseQuery<Season>({
  queryFn: async () => {
    const { data, error } = await supabase
      .from('seasons')
      .select('*')
      .single()

    if (error) throw error
    return data
  },
  deps: [],
  onSuccess: (data) => {
    console.log('Season loaded:', data)
    // Update other state, trigger analytics, etc.
  },
  onError: (error) => {
    console.error('Failed to load season:', error)
    // Custom error handling
  }
})
```

## useSupabaseMutation

### Basic Usage

```tsx
import { useSupabaseMutation } from '@/hooks/useSupabaseMutation'
import { supabase, type ShopReview } from '@/lib/supabase'

function MyComponent() {
  const { mutate, loading, error } = useSupabaseMutation<
    ShopReview,
    { shopId: string; rating: number }
  >({
    mutationFn: async ({ shopId, rating }) => {
      const { data, error } = await supabase
        .from('shop_reviews')
        .insert({ shop_id: shopId, rating })
        .select()
        .single()

      if (error) throw new Error(`Failed to save review: ${error.message}`)
      return data
    },
    showSuccessToast: true,
    successMessage: 'Review saved successfully',
    onSuccess: (data) => {
      // Refetch related queries, navigate, etc.
    }
  })

  const handleSubmit = async () => {
    await mutate({ shopId: '123', rating: 5 })
  }

  return (
    <button onClick={handleSubmit} disabled={loading}>
      {loading ? 'Saving...' : 'Save Review'}
    </button>
  )
}
```

### API Reference

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `mutationFn` | `(variables: TVariables) => Promise<TData>` | **Required** | The mutation function |
| `showSuccessToast` | `boolean` | `false` | Show success toast |
| `showErrorToast` | `boolean` | `true` | Show error toast on failure |
| `successMessage` | `string` | `undefined` | Custom success toast message |
| `errorMessage` | `string` | `undefined` | Custom error toast message |
| `onSuccess` | `(data: TData, variables: TVariables) => void` | `undefined` | Callback on success |
| `onError` | `(error: Error, variables: TVariables) => void` | `undefined` | Callback on error |
| `onSettled` | `(data, error, variables) => void` | `undefined` | Callback on completion |

#### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `data` | `TData \| null` | The mutation result |
| `loading` | `boolean` | Loading state |
| `error` | `string \| null` | Error message |
| `mutate` | `(variables: TVariables) => Promise<void>` | Execute mutation |
| `reset` | `() => void` | Reset mutation state |

### Advanced Examples

#### With Refetch

```tsx
function useShopReviews() {
  const { data: reviews, refetch } = useSupabaseQuery<Review[]>({
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shop_reviews')
        .select('*')

      if (error) throw error
      return data || []
    },
    deps: []
  })

  const { mutate: deleteReview, loading: deleting } = useSupabaseMutation<void, string>({
    mutationFn: async (reviewId) => {
      const { error } = await supabase
        .from('shop_reviews')
        .delete()
        .eq('id', reviewId)

      if (error) throw new Error(`Failed to delete: ${error.message}`)
    },
    showSuccessToast: true,
    successMessage: 'Review deleted',
    onSuccess: () => {
      refetch() // Refetch the reviews list
    }
  })

  return { reviews, deleteReview, deleting }
}
```

#### Multiple Mutations

```tsx
function useReviewMutations() {
  const saveReview = useSupabaseMutation({
    mutationFn: async (data) => {
      const { data: result, error } = await supabase
        .from('reviews')
        .insert(data)
        .select()
        .single()

      if (error) throw error
      return result
    },
    showSuccessToast: true,
    successMessage: 'Review saved'
  })

  const deleteReview = useSupabaseMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    showSuccessToast: true,
    successMessage: 'Review deleted'
  })

  return {
    saveReview: saveReview.mutate,
    deleteReview: deleteReview.mutate,
    isSaving: saveReview.loading || deleteReview.loading
  }
}
```

## Migration Guide

### Before (Manual Pattern)

```tsx
function useSeasonData() {
  const [season, setSeason] = useState<Season | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSeason = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error } = await supabase
          .from('seasons')
          .select('*')
          .single()

        if (error) {
          throw new Error(`Failed to fetch season: ${error.message}`)
        }

        setSeason(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchSeason()
  }, [])

  return { season, loading, error }
}
```

### After (Using useSupabaseQuery)

```tsx
function useSeasonData() {
  const { data: season, loading, error } = useSupabaseQuery<Season>({
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seasons')
        .select('*')
        .single()

      if (error) throw new Error(`Failed to fetch season: ${error.message}`)
      return data
    },
    deps: [],
    showErrorToast: true
  })

  return { season, loading, error }
}
```

## Best Practices

1. **Always throw errors in queryFn/mutationFn** - The hooks catch and handle them
2. **Use typed generics** - `useSupabaseQuery<YourType>` for better type safety
3. **Leverage callbacks** - Use `onSuccess` to refetch related queries
4. **Use `enabled` for conditional queries** - Prevents unnecessary requests
5. **Combine multiple queries** - Use separate hooks for parallel queries
6. **Handle errors in UI** - Check the `error` state and display appropriately
7. **Use `refetch`** - For manual data refresh (pull-to-refresh, retry buttons)

## Common Patterns

### Pattern 1: List + Create/Delete

```tsx
function useItems() {
  const { data: items, loading, refetch } = useSupabaseQuery<Item[]>({
    queryFn: async () => {
      const { data, error } = await supabase.from('items').select('*')
      if (error) throw error
      return data || []
    },
    deps: []
  })

  const { mutate: createItem } = useSupabaseMutation({
    mutationFn: async (item: NewItem) => {
      const { error } = await supabase.from('items').insert(item)
      if (error) throw error
    },
    showSuccessToast: true,
    onSuccess: () => refetch()
  })

  const { mutate: deleteItem } = useSupabaseMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('items').delete().eq('id', id)
      if (error) throw error
    },
    showSuccessToast: true,
    onSuccess: () => refetch()
  })

  return { items, loading, createItem, deleteItem }
}
```

### Pattern 2: Dependent Queries

```tsx
function useUserWithPosts(userId: string | null) {
  const { data: user } = useSupabaseQuery({
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      if (error) throw error
      return data
    },
    deps: [userId],
    enabled: !!userId
  })

  const { data: posts } = useSupabaseQuery({
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user?.id)
      if (error) throw error
      return data || []
    },
    deps: [user?.id],
    enabled: !!user
  })

  return { user, posts }
}
```

## See Also

- Example refactorings in:
  - `useSeasonData.refactored.example.ts`
  - `useShopReviews.refactored.example.ts`
