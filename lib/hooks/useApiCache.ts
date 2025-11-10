import { useState, useEffect, useCallback } from 'react'
import { cache, getCacheKey } from '@/lib/cache'

interface UseApiCacheOptions {
  ttl?: number // Time to live in milliseconds
  enabled?: boolean
}

export function useApiCache<T>(
  url: string,
  cacheKey: string,
  options: UseApiCacheOptions = {}
) {
  const { ttl = 5 * 60 * 1000, enabled = true } = options
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!enabled) return

    try {
      setLoading(true)
      setError(null)

      // Check cache first
      const cachedData = cache.get<T>(cacheKey)
      if (cachedData) {
        setData(cachedData)
        setLoading(false)
        return
      }

      // Fetch from API
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      // Cache the result
      cache.set(cacheKey, result, ttl)
      setData(result)
    } catch (err) {
      console.error(`Error fetching ${url}:`, err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [url, cacheKey, ttl, enabled])

  const refetch = useCallback(() => {
    cache.delete(cacheKey)
    return fetchData()
  }, [fetchData, cacheKey])

  const invalidate = useCallback(() => {
    cache.delete(cacheKey)
    setData(null)
  }, [cacheKey])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refetch,
    invalidate
  }
}

// Pre-configured hooks for common API calls
export function useUsers(options?: UseApiCacheOptions) {
  return useApiCache<any[]>('/api/users', getCacheKey.workspaces(), {
    ttl: 10 * 60 * 1000, // 10 minutes
    ...options
  })
}

export function useTasks(workspaceId: string, options?: UseApiCacheOptions) {
  return useApiCache<any[]>(`/api/tasks?workspaceId=${workspaceId}`, getCacheKey.tasks(workspaceId), {
    ttl: 2 * 60 * 1000, // 2 minutes
    ...options
  })
}

export function useProjects(workspaceId: string, options?: UseApiCacheOptions) {
  return useApiCache<any[]>(`/api/projects?workspaceId=${workspaceId}`, getCacheKey.projects(workspaceId), {
    ttl: 5 * 60 * 1000, // 5 minutes
    ...options
  })
}
