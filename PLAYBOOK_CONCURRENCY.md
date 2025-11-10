# Concurrency Control Playbook

## Consistency Model

### Read Model
- **Eventual Consistency**: Reads may be slightly stale but eventually consistent
- **Cache Coherence**: Tag-based invalidation ensures cache freshness
- **TTL Windows**: LRU cache with 30-60s TTL for hot endpoints

### Write Model
- **Optimistic Concurrency Control (OCC)**: All mutations require `version` or `updated_at`
- **Idempotency**: Mutations include `clientMutationId` to prevent duplicates
- **Serialization**: Server-side mutex per resource (e.g., `task_id`) to prevent state races

## Conflict Resolution Flow

### 1. Client Side (Optimistic Update)
```
User edits task → Immediate UI update (optimistic)
                 ↓
              Send mutation with version
                 ↓
```

### 2. Server Side (Version Check)
```
Receive mutation
                 ↓
Check if version matches current version
                 ↓
         Match? → Process mutation → Return 200
         Mismatch? → Return 409 Conflict
```

### 3. Client Side (Conflict Handling)
```
409 Response received
                 ↓
Show conflict resolution modal
                 ↓
User chooses:
  - "Refrescar y aplicar mis cambios" → Fetch latest, reapply user changes
  - "Descartar mis cambios" → Revert optimistic update
```

## Conflict Resolution UI

When a 409 conflict is detected:
1. Show modal with:
   - "Esta tarea cambió mientras la editabas"
   - Current server state (read-only)
   - User's changes (editable)
   - Options: "Refrescar y aplicar" / "Descartar"

2. On "Refrescar y aplicar":
   - Fetch latest version
   - Merge user changes onto latest
   - Retry mutation

3. On "Descartar":
   - Revert optimistic update
   - Show current server state

## Mutex Strategy

Per-resource serialization:
- Key: `task:{taskId}` or `project:{projectId}`
- Duration: Duration of mutation processing
- Prevents concurrent mutations from causing state inconsistencies

## Idempotency

All mutations include:
```typescript
{
  clientMutationId: string // UUID generated client-side
  // ... other fields
}
```

Server:
- Checks if `clientMutationId` was already processed
- If yes, returns previous result (idempotent)
- If no, processes and stores `clientMutationId`

## Testing

### Simulate Concurrent Edits
1. Open same task in two tabs
2. Edit in Tab 1, save
3. Edit in Tab 2, save
4. Tab 2 should receive 409
5. Tab 2 should show conflict resolution modal

