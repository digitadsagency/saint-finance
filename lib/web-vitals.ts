/**
 * Web Vitals reporting
 * Only enabled when PERF_HARDENING=true
 */

export function reportWebVitals(metric: any) {
  const isPerfHardening = process.env.NEXT_PUBLIC_PERF_HARDENING === 'true'
  
  if (!isPerfHardening) return

  // Log to console in dev
  if (process.env.NODE_ENV === 'development') {
    console.log('[Web Vitals]', metric.name, metric.value)
  }

  // Send to API endpoint
  if (typeof window !== 'undefined') {
    fetch('/api/vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: metric.name,
        value: metric.value,
        id: metric.id,
        delta: metric.delta,
        rating: metric.rating,
      }),
      keepalive: true,
    }).catch(() => {
      // Silently fail if API is unavailable
    })
  }
}

