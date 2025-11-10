# Performance Hardening Guide

## Activar optimizaciones

Para activar todas las optimizaciones de rendimiento, establece la variable de entorno:

```bash
PERF_HARDENING=true
NEXT_PUBLIC_PERF_HARDENING=true
```

**Nota:** Las optimizaciones están desactivadas por defecto en producción. Actívalas solo en staging/testing.

## Características Implementadas

### 1. Caching
- **LRU Cache in-memory**: 30-60s TTL para endpoints calientes
- **Tag-based revalidation**: Invalida cache cuando se hacen mutaciones
- **Cache-Control headers**: Configurados para CDN/proxy caching

### 2. Concurrencia
- **Optimistic Concurrency Control (OCC)**: Verifica versiones en mutaciones
- **Conflict Resolution UI**: Modal para resolver conflictos 409
- **Idempotency**: `clientMutationId` para prevenir duplicados

### 3. I/O Optimization
- **Circuit Breaker**: Previene cascadas de fallos
- **Exponential Backoff**: Retry automático con backoff
- **Request Deduplication**: React Query deduplica automáticamente

### 4. Bundle Optimization
- **Bundle Analyzer**: `npm run analyze`
- **Dynamic Imports**: Componentes pesados cargados bajo demanda
- **Tree Shaking**: Optimizado para lucide-react

### 5. Observability
- **Web Vitals**: Reporte automático a `/api/vitals`
- **Health Endpoints**: `/api/healthz` y `/api/readyz`
- **Cache Hit/Miss Headers**: `X-Cache` header en respuestas

## Uso

### Bundle Analysis
```bash
npm run analyze
```

### Lighthouse CI
```bash
npm run lighthouse
```

### Health Checks
```bash
curl http://localhost:3000/api/healthz
curl http://localhost:3000/api/readyz
```

## Testing

### Simular conflicto concurrente:
1. Abre la misma tarea en dos pestañas
2. Edita en pestaña 1, guarda
3. Edita en pestaña 2, guarda
4. Pestaña 2 debería recibir 409 y mostrar modal de resolución

### Stress Test (Playwright):
```bash
npm run test:e2e -- tests/stress/kanban-300-tasks.spec.ts
```

## Métricas Esperadas

- **LCP**: < 2.5s (Fast 3G)
- **p95 API latency**: < 300ms (cache caliente)
- **Bundle principal**: < 250KB (gzip)

## Feature Flags

Todas las optimizaciones están detrás de `PERF_HARDENING=true`. Si no está activado, el comportamiento es idéntico al original.

