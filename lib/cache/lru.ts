/**
 * Simple LRU Cache implementation for server-side caching
 * Only enabled when PERF_HARDENING=true
 */

interface LRUNode<T> {
  key: string
  value: T
  expires: number
  prev?: LRUNode<T>
  next?: LRUNode<T>
}

export class LRUCache<T> {
  private maxSize: number
  private ttl: number // Time to live in milliseconds
  private cache: Map<string, LRUNode<T>>
  private head?: LRUNode<T>
  private tail?: LRUNode<T>

  constructor(maxSize: number = 100, ttl: number = 30000) {
    this.maxSize = maxSize
    this.ttl = ttl
    this.cache = new Map()
  }

  get(key: string): T | undefined {
    const node = this.cache.get(key)
    if (!node) return undefined

    // Check if expired
    if (Date.now() > node.expires) {
      this.delete(key)
      return undefined
    }

    // Move to head (most recently used)
    this.moveToHead(node)
    return node.value
  }

  set(key: string, value: T): void {
    const now = Date.now()
    const expires = now + this.ttl

    let node = this.cache.get(key)

    if (node) {
      // Update existing node
      node.value = value
      node.expires = expires
      this.moveToHead(node)
    } else {
      // Create new node
      node = { key, value, expires }

      if (this.cache.size >= this.maxSize) {
        // Remove least recently used (tail)
        if (this.tail) {
          this.delete(this.tail.key)
        }
      }

      this.cache.set(key, node)
      this.moveToHead(node)
    }
  }

  delete(key: string): void {
    const node = this.cache.get(key)
    if (!node) return

    // Remove from linked list
    if (node.prev) node.prev.next = node.next
    if (node.next) node.next.prev = node.prev
    if (this.head === node) this.head = node.next
    if (this.tail === node) this.tail = node.prev

    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
    this.head = undefined
    this.tail = undefined
  }

  private moveToHead(node: LRUNode<T>): void {
    // Remove from current position
    if (node.prev) node.prev.next = node.next
    if (node.next) node.next.prev = node.prev
    if (this.tail === node) this.tail = node.prev

    // Insert at head
    node.prev = undefined
    node.next = this.head
    if (this.head) this.head.prev = node
    this.head = node
    if (!this.tail) this.tail = node
  }
}

// Singleton instance (per server instance)
let cacheInstance: LRUCache<any> | null = null

export function getLRUCache<T>(maxSize: number = 100, ttl: number = 30000): LRUCache<T> {
  if (!process.env.PERF_HARDENING) {
    // Return no-op cache if not enabled
    return {
      get: () => undefined,
      set: () => {},
      delete: () => {},
      clear: () => {},
    } as LRUCache<T>
  }

  if (!cacheInstance) {
    cacheInstance = new LRUCache<T>(maxSize, ttl)
  }
  return cacheInstance as LRUCache<T>
}

