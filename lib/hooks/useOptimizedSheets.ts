import { useCallback, useMemo } from 'react'
import { cache, getCacheKey } from '@/lib/cache'

interface UseOptimizedSheetsOptions {
  ttl?: number
  enabled?: boolean
  staleTime?: number
}

export function useOptimizedSheets(options: UseOptimizedSheetsOptions = {}) {
  const { ttl = 5 * 60 * 1000, enabled = true, staleTime = 2 * 60 * 1000 } = options

  // Batch multiple API calls
  const batchFetch = useCallback(async (requests: Array<{ url: string; cacheKey: string }>) => {
    if (!enabled) return []

    const results = await Promise.allSettled(
      requests.map(async ({ url, cacheKey }) => {
        // Check cache first
        const cached = cache.get(cacheKey)
        if (cached) {
          return { data: cached, fromCache: true }
        }

        // Fetch from API
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        
        // Cache the result
        cache.set(cacheKey, data, ttl)
        return { data, fromCache: false }
      })
    )

    return results.map((result, index) => ({
      ...result,
      cacheKey: requests[index].cacheKey,
      url: requests[index].url
    }))
  }, [enabled, ttl])

  // Optimized data fetching with intelligent caching
  const fetchWithCache = useCallback(async (url: string, cacheKey: string) => {
    if (!enabled) return null

    // Check cache first
    const cached = cache.get(cacheKey)
    if (cached) {
      return { data: cached, fromCache: true }
    }

    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      // Cache the result
      cache.set(cacheKey, data, ttl)
      return { data, fromCache: false }
    } catch (error) {
      console.error(`Error fetching ${url}:`, error)
      throw error
    }
  }, [enabled, ttl])

  // Preload critical data
  const preloadData = useCallback(async (workspaceId: string) => {
    const requests = [
      { url: '/api/users', cacheKey: getCacheKey.workspaces() },
      { url: `/api/tasks?workspaceId=${workspaceId}`, cacheKey: getCacheKey.tasks(workspaceId) },
      { url: `/api/projects?workspaceId=${workspaceId}`, cacheKey: getCacheKey.projects(workspaceId) }
    ]

    return batchFetch(requests)
  }, [batchFetch])

  // Invalidate related cache entries
  const invalidateWorkspace = useCallback((workspaceId: string) => {
    cache.invalidatePattern(`.*:${workspaceId}`)
    cache.delete(getCacheKey.workspaces())
  }, [])

  // Get cache statistics
  const getCacheStats = useCallback(() => {
    const cacheKeys = Array.from(cache['cache'].keys())
    return {
      totalEntries: cacheKeys.length,
      entries: cacheKeys.map(key => ({
        key,
        hasData: cache.has(key)
      }))
    }
  }, [])

  return {
    batchFetch,
    fetchWithCache,
    preloadData,
    invalidateWorkspace,
    getCacheStats
  }
}

// Specialized hook for workspace data with optimizations
export function useOptimizedWorkspaceData(workspaceId: string) {
  const { batchFetch, invalidateWorkspace } = useOptimizedSheets()

  const loadWorkspaceData = useCallback(async () => {
    const requests = [
      { url: '/api/users', cacheKey: getCacheKey.workspaces() },
      { url: `/api/tasks?workspaceId=${workspaceId}`, cacheKey: getCacheKey.tasks(workspaceId) },
      { url: `/api/projects?workspaceId=${workspaceId}`, cacheKey: getCacheKey.projects(workspaceId) }
    ]

    return batchFetch(requests)
  }, [workspaceId, batchFetch])

  const refreshWorkspace = useCallback(() => {
    invalidateWorkspace(workspaceId)
    return loadWorkspaceData()
  }, [workspaceId, invalidateWorkspace, loadWorkspaceData])

  return {
    loadWorkspaceData,
    refreshWorkspace
  }
}
