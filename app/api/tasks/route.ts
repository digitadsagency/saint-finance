import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-simple'
import { TasksService } from '@/lib/services/tasks'
import { CreateTaskSchema } from '@/lib/validation'
import { unstable_cache } from 'next/cache'
import { CACHE_TAGS, invalidateCacheTags } from '@/lib/cache/tags'
import { getLRUCache } from '@/lib/cache/lru'
import { retryWithBackoff } from '@/lib/io/retry'
import { getCircuitBreaker } from '@/lib/io/circuit-breaker'

const isPerfHardening = process.env.PERF_HARDENING === 'true'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const workspaceId = searchParams.get('workspaceId')
    const assigneeId = searchParams.get('assigneeId')
    const status = searchParams.get('status')

    // Build cache key
    const cacheKey = `tasks:${projectId || workspaceId || 'all'}:${assigneeId || 'all'}:${status || 'all'}`
    
    // Check LRU cache first (if enabled)
    if (isPerfHardening) {
      const lruCache = getLRUCache<any[]>()
      const cached = lruCache.get(cacheKey)
      if (cached) {
        return NextResponse.json(cached, {
          headers: {
            'X-Cache': 'HIT',
            'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          },
        })
      }
    }

    // Fetch with circuit breaker and retry
    let tasks: any[]
    if (isPerfHardening) {
      const breaker = getCircuitBreaker('/api/tasks')
      tasks = await breaker.execute(async () => {
        return await retryWithBackoff(async () => {
          if (projectId) {
            return await TasksService.getTasksByProject(projectId)
          } else if (workspaceId) {
            return await TasksService.getAllTasks(workspaceId)
          } else {
            return []
          }
        })
      })
    } else {
      if (projectId) {
        tasks = await TasksService.getTasksByProject(projectId)
      } else if (workspaceId) {
        tasks = await TasksService.getAllTasks(workspaceId)
      } else {
        tasks = []
      }
    }

    // Apply additional filters
    if (assigneeId) {
      tasks = tasks.filter(task => task.assignee_id === assigneeId)
    }
    if (status) {
      tasks = tasks.filter(task => task.status === status)
    }

    // Store in LRU cache
    if (isPerfHardening) {
      const lruCache = getLRUCache<any[]>()
      lruCache.set(cacheKey, tasks)
    }

    return NextResponse.json(tasks, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // For now, skip authentication to allow task creation
    // const user = getCurrentUser(request)
    // if (!user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const body = await request.json()
    console.log('📝 Creating task with data:', body)
    
    // Basic validation
    if (!body.project_id || !body.title) {
      return NextResponse.json({ error: 'project_id and title are required' }, { status: 400 })
    }

    const task = await TasksService.createTask({
      project_id: body.project_id,
      title: body.title,
      description: body.description || '',
      priority: body.priority || 'medium',
      assignee_id: body.assignee_id || 'user-1',
      due_date: body.due_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      estimate_hours: body.estimate_hours
    })

    // Invalidate cache tags
    if (isPerfHardening) {
      invalidateCacheTags([
        CACHE_TAGS.tasksByProject(body.project_id),
        CACHE_TAGS.tasksByWorkspace(body.project_id), // TODO: get workspaceId from project
        CACHE_TAGS.tasksAll(),
      ])
      
      // Clear LRU cache for related keys
      const lruCache = getLRUCache<any[]>()
      lruCache.delete(`tasks:${body.project_id}:all:all`)
    }

    console.log('✅ Task created successfully:', task)
    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}