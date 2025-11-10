# Performance Hardening Notes

## Baseline Metrics (Pre-Optimization)

### Web Vitals (Target)
- **LCP (Largest Contentful Paint)**: Target < 2.5s (Fast 3G)
- **FCP (First Contentful Paint)**: Target < 1.8s
- **CLS (Cumulative Layout Shift)**: Target < 0.1
- **TBT (Total Blocking Time)**: Target < 200ms
- **TTFB (Time to First Byte)**: Target < 600ms

### Bundle Size (Target)
- **Main bundle (gzip)**: Target < 250KB
- **Initial JS**: Target < 300KB

### API Latency (Target)
- **p95 `/api/tasks?projectId=...`**: Target < 300ms (cache caliente)
- **p99**: Target < 500ms

## Changes Summary

### 1. Next.js Performance
- Dynamic imports for heavy components (Kanban, Calendar)
- Route segment config optimization
- Code-splitting por rutas

### 2. React Query Configuration
- Centralized `QueryClient` with optimized defaults
- Batch queries with `useQueries`
- Request deduplication (built-in)
- Optimistic updates with rollback

### 3. Server-Side Caching
- Tag-based revalidation (`revalidateTag`)
- LRU in-memory cache (30-60s TTL)
- Cache invalidation on mutations

### 4. Concurrency Control
- Optimistic Concurrency Control (OCC) with version/updated_at
- 409 Conflict responses
- UI for conflict resolution (modal)

### 5. Render Performance
- Virtualization for large lists (react-virtual)
- React.memo for TaskCard components
- Suspense boundaries for async components

### 6. I/O Optimization
- Batch reads/writes (where supported)
- Exponential backoff for rate limits
- Circuit breaker pattern

## Feature Flags

All optimizations are behind `PERF_HARDENING=true` env flag.

**Default behavior:**
- `PERF_HARDENING=false` in production (current behavior)
- `PERF_HARDENING=true` in staging (all optimizations enabled)

## After Metrics

(To be measured in staging environment after implementation)

