/**
 * Simple Circuit Breaker pattern for API calls
 * Only enabled when PERF_HARDENING=true
 */

const isPerfHardening = process.env.PERF_HARDENING === 'true'

export enum CircuitState {
  CLOSED = 'closed', // Normal operation
  OPEN = 'open', // Failing, reject requests
  HALF_OPEN = 'half-open', // Testing if recovered
}

export interface CircuitBreakerOptions {
  failureThreshold: number // Open circuit after N failures
  resetTimeout: number // Time in ms before attempting recovery
  successThreshold: number // Close circuit after N successes (half-open)
  windowSize: number // Time window for counting failures
}

const defaultOptions: CircuitBreakerOptions = {
  failureThreshold: 5,
  resetTimeout: 60000, // 1 minute
  successThreshold: 2,
  windowSize: 30000, // 30 seconds
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED
  private failures: number[] = [] // Timestamps of failures
  private successes: number = 0
  private options: CircuitBreakerOptions
  private lastFailureTime?: number

  constructor(options: Partial<CircuitBreakerOptions> = {}) {
    this.options = { ...defaultOptions, ...options }
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (!isPerfHardening) {
      return fn() // No-op if not enabled
    }

    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitState.HALF_OPEN
        this.successes = 0
      } else {
        throw new Error('Circuit breaker is OPEN')
      }
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess(): void {
    this.cleanOldFailures()

    if (this.state === CircuitState.HALF_OPEN) {
      this.successes++
      if (this.successes >= this.options.successThreshold) {
        this.state = CircuitState.CLOSED
        this.failures = []
      }
    }
  }

  private onFailure(): void {
    const now = Date.now()
    this.failures.push(now)
    this.lastFailureTime = now
    this.cleanOldFailures()

    if (this.failures.length >= this.options.failureThreshold) {
      this.state = CircuitState.OPEN
    }
  }

  private cleanOldFailures(): void {
    const cutoff = Date.now() - this.options.windowSize
    this.failures = this.failures.filter(time => time > cutoff)
  }

  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return false
    return Date.now() - this.lastFailureTime >= this.options.resetTimeout
  }

  getState(): CircuitState {
    return this.state
  }

  reset(): void {
    this.state = CircuitState.CLOSED
    this.failures = []
    this.successes = 0
    this.lastFailureTime = undefined
  }
}

// Per-endpoint circuit breakers
const breakers = new Map<string, CircuitBreaker>()

export function getCircuitBreaker(endpoint: string): CircuitBreaker {
  if (!breakers.has(endpoint)) {
    breakers.set(endpoint, new CircuitBreaker())
  }
  return breakers.get(endpoint)!
}

