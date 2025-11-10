/**
 * Optimistic Concurrency Control utilities
 * Only enabled when PERF_HARDENING=true
 */

const isPerfHardening = process.env.PERF_HARDENING === 'true'

export interface VersionedResource {
  version?: number
  updated_at?: string
  id: string
}

export interface MutationPayload {
  clientMutationId?: string
  version?: number
  updated_at?: string
  [key: string]: any
}

/**
 * Check if resource version matches mutation version
 */
export function checkVersion<T extends VersionedResource>(
  resource: T | null,
  payload: MutationPayload
): { valid: boolean; conflict?: T } {
  if (!isPerfHardening || !resource || !payload.version && !payload.updated_at) {
    return { valid: true }
  }

  // Check version number
  if (payload.version !== undefined && resource.version !== undefined) {
    if (payload.version !== resource.version) {
      return { valid: false, conflict: resource }
    }
  }

  // Check updated_at timestamp
  if (payload.updated_at && resource.updated_at) {
    const payloadTime = new Date(payload.updated_at).getTime()
    const resourceTime = new Date(resource.updated_at).getTime()
    if (Math.abs(payloadTime - resourceTime) > 1000) { // 1 second tolerance
      return { valid: false, conflict: resource }
    }
  }

  return { valid: true }
}

/**
 * Generate client mutation ID for idempotency
 */
export function generateClientMutationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

