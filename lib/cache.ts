interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class SimpleCache {
  private cache = new Map<string, CacheItem<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  // Invalidate cache by pattern
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }
}

export const cache = new SimpleCache();

// Cache key generators
export const getCacheKey = {
  workspace: (id: string) => `workspace:${id}`,
  workspaces: () => 'workspaces:all',
  project: (id: string) => `project:${id}`,
  projects: (workspaceId: string) => `projects:${workspaceId}`,
  task: (id: string) => `task:${id}`,
  tasks: (projectId: string) => `tasks:${projectId}`,
  userTasks: (userId: string) => `user-tasks:${userId}`,
  comments: (taskId: string) => `comments:${taskId}`,
  attachments: (taskId: string) => `attachments:${taskId}`,
};
