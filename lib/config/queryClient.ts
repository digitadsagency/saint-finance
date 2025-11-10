import { QueryClient } from '@tanstack/react-query'

const isPerfHardening = process.env.NEXT_PUBLIC_PERF_HARDENING === 'true'

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: isPerfHardening ? 30_000 : 60_000, // 30s with perf, 60s without
        gcTime: isPerfHardening ? 5 * 60_000 : 5 * 60_000, // 5 minutes (was cacheTime)
        retry: isPerfHardening ? 2 : 3,
        refetchOnWindowFocus: false,
        refetchOnMount: false, // Only refetch if stale
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 1,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
    },
  })
}

