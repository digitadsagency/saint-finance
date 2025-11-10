import { useState, useEffect, useCallback } from 'react'
import { cache, getCacheKey } from '@/lib/cache'

interface WorkspaceData {
  users: any[]
  tasks: any[]
  projects: any[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useWorkspaceData(workspaceId: string): WorkspaceData {
  const [users, setUsers] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Check cache first
      const usersCacheKey = getCacheKey.workspaces()
      const tasksCacheKey = getCacheKey.tasks(workspaceId)
      const projectsCacheKey = getCacheKey.projects(workspaceId)

      const cachedUsers = cache.get(usersCacheKey)
      const cachedTasks = cache.get(tasksCacheKey)
      const cachedProjects = cache.get(projectsCacheKey)

      // Load data in parallel
      const promises = []

      if (!cachedUsers) {
        promises.push(
          fetch('/api/users').then(res => res.json()).then(data => {
            cache.set(usersCacheKey, data, 5 * 60 * 1000) // 5 minutes
            return { type: 'users', data }
          })
        )
      } else {
        promises.push(Promise.resolve({ type: 'users', data: cachedUsers }))
      }

      if (!cachedTasks) {
        promises.push(
          fetch(`/api/tasks?workspaceId=${workspaceId}`).then(res => res.json()).then(data => {
            cache.set(tasksCacheKey, data, 2 * 60 * 1000) // 2 minutes
            return { type: 'tasks', data }
          })
        )
      } else {
        promises.push(Promise.resolve({ type: 'tasks', data: cachedTasks }))
      }

      if (!cachedProjects) {
        promises.push(
          fetch(`/api/projects?workspaceId=${workspaceId}`).then(res => res.json()).then(data => {
            cache.set(projectsCacheKey, data, 5 * 60 * 1000) // 5 minutes
            return { type: 'projects', data }
          })
        )
      } else {
        promises.push(Promise.resolve({ type: 'projects', data: cachedProjects }))
      }

      const results = await Promise.all(promises)

      results.forEach(result => {
        switch (result.type) {
          case 'users':
            setUsers(result.data)
            break
          case 'tasks':
            setTasks(result.data)
            break
          case 'projects':
            setProjects(result.data)
            break
        }
      })

    } catch (err) {
      console.error('Error loading workspace data:', err)
      setError(err instanceof Error ? err.message : 'Error loading data')
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  const refetch = useCallback(async () => {
    // Clear cache for this workspace
    cache.invalidatePattern(`.*:${workspaceId}`)
    cache.delete(getCacheKey.workspaces())
    await loadData()
  }, [loadData, workspaceId])

  useEffect(() => {
    if (workspaceId) {
      loadData()
    }
  }, [loadData, workspaceId])

  return {
    users,
    tasks,
    projects,
    loading,
    error,
    refetch
  }
}
