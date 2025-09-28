import { useState, useCallback, useRef } from 'react'

interface UseOptimizedFetchOptions {
  enabled?: boolean
  staleTime?: number
  retryCount?: number
}

interface CacheEntry<T> {
  data: T
  timestamp: number
  promise?: Promise<T>
}

// Simple in-memory cache
const cache = new Map<string, CacheEntry<any>>()

export function useOptimizedFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: UseOptimizedFetchOptions = {}
) {
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    retryCount = 2
  } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const retryCountRef = useRef(0)

  const execute = useCallback(async (): Promise<T | void> => {
    if (!enabled) return

    // Check cache first
    const cached = cache.get(key)
    const now = Date.now()
    
    if (cached && (now - cached.timestamp) < staleTime) {
      setData(cached.data)
      return cached.data
    }

    // If there's already a pending request, return that promise
    if (cached?.promise) {
      try {
        const result = await cached.promise
        setData(result)
        return result
      } catch (err) {
        // Continue to retry logic
      }
    }

    setLoading(true)
    setError(null)

    const fetchPromise = (async () => {
      try {
        const result = await fetchFn()
        
        // Cache the result
        cache.set(key, {
          data: result,
          timestamp: now,
          promise: undefined
        })
        
        setData(result)
        retryCountRef.current = 0
        return result
      } catch (err) {
        const error = err as Error
        
        if (retryCountRef.current < retryCount) {
          retryCountRef.current++
          // Retry after a short delay
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCountRef.current))
          return execute()
        }
        
        setError(error)
        throw error
      } finally {
        setLoading(false)
      }
    })()

    // Cache the promise to prevent duplicate requests
    cache.set(key, {
      data: cached?.data || null,
      timestamp: cached?.timestamp || 0,
      promise: fetchPromise
    })

    return fetchPromise
  }, [key, fetchFn, enabled, staleTime, retryCount])

  const invalidate = useCallback(() => {
    cache.delete(key)
  }, [key])

  const clearCache = useCallback(() => {
    cache.clear()
  }, [])

  return {
    data,
    loading,
    error,
    execute,
    invalidate,
    clearCache
  }
}

// Utility function to create cache keys
export function createCacheKey(prefix: string, params: Record<string, any> = {}) {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|')
  
  return `${prefix}:${sortedParams}`
}

