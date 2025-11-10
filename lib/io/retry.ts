/**
 * Exponential backoff retry utility
 * Only enabled when PERF_HARDENING=true
 */

const isPerfHardening = process.env.PERF_HARDENING === 'true'

export interface RetryOptions {
  maxRetries: number
  initialDelay: number
  maxDelay: number
  backoffMultiplier: number
  retryableErrors?: (error: any) => boolean
}

const defaultOptions: RetryOptions = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  retryableErrors: (error: any) => {
    // Retry on network errors or 5xx errors
    if (error?.response?.status >= 500) return true
    if (error?.response?.status === 429) return true // Rate limit
    if (!error?.response) return true // Network error
    return false
  },
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  if (!isPerfHardening) {
    return fn() // No-op if not enabled
  }

  const opts = { ...defaultOptions, ...options }
  let lastError: any

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      if (attempt === opts.maxRetries) {
        throw error
      }

      if (opts.retryableErrors && !opts.retryableErrors(error)) {
        throw error
      }

      const delay = Math.min(
        opts.initialDelay * Math.pow(opts.backoffMultiplier, attempt),
        opts.maxDelay
      )

      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

