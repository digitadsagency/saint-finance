/**
 * Tag-based cache invalidation utilities
 * Only enabled when PERF_HARDENING=true
 */

// Note: revalidateTag only works in Server Components/Route Handlers
// For API routes, we invalidate via LRU cache instead

const isPerfHardening = process.env.PERF_HARDENING === 'true'

export const CACHE_TAGS = {
  task: (taskId: string) => `task:${taskId}`,
  tasksByProject: (projectId: string) => `tasks:project:${projectId}`,
  tasksByWorkspace: (workspaceId: string) => `tasks:workspace:${workspaceId}`,
  tasksByUser: (userId: string) => `tasks:user:${userId}`,
  tasksAll: () => 'tasks:all',
  project: (projectId: string) => `project:${projectId}`,
  projectsByWorkspace: (workspaceId: string) => `projects:workspace:${workspaceId}`,
  projectsAll: () => 'projects:all',
  user: (userId: string) => `user:${userId}`,
  usersAll: () => 'users:all',
  financeSalaries: (workspaceId: string) => `finance:salaries:${workspaceId}`,
  financeBilling: (workspaceId: string) => `finance:billing:${workspaceId}`,
  financeWorklogs: (workspaceId: string) => `finance:worklogs:${workspaceId}`,
  financeMetrics: (workspaceId: string, month: string) => `finance:metrics:${workspaceId}:${month}`,
  dailyLogs: (workspaceId: string, userId?: string) => 
    userId ? `dailylog:${workspaceId}:${userId}` : `dailylog:${workspaceId}:all`,
} as const

export function invalidateCacheTags(tags: string[]): void {
  if (!isPerfHardening) return
  // In API routes, we use LRU cache invalidation instead
  // revalidateTag only works in Server Components/App Router routes
  // This is a no-op here, actual invalidation happens via LRU cache
}

