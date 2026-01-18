# Skill: Frontend Engineering (Anti-Gravity Patterns) ⚛️

## Context
"Anti-Gravity" refers to the user experience principle where the UI feels weightless and instantaneous, decoupling the user's perception of latency from the actual network request.

## 🌉 The Hybrid Data Model
For complex, interactive visualizers (like Factory Layouts or Floor Plans), pure relational data is too slow and rigid. We use a **Hybrid Model**:

1.  **Relational Backbone**: Core entities (Assets, Production Lines) live in Postgres tables (`Asset`, `ProductionLine`) to maintain referential integrity.
2.  **JSON Skin**: Visual layout data (x, y, rotation, color overrides) lives in a `meta_json` column or a dedicated light-schema table (`FactoryLayoutNode`).
3.  **The Benefit**: You can move a node instantly (JSON update) without complex relational cascading updates, but the node still represents a real database entity.

## ⚡ Optimistic Mutation Protocol
To eliminate "Spinner Fatigue" and 500ms lag on every action:

### 1. The Hook Pattern (useNodeUpdate)
Never await `axios.patch` directly in the event handler. Use `@tanstack/react-query`'s `onMutate`.

```typescript
const updateNode = useMutation({
    mutationFn: (payload) => axios.patch(...),
    onMutate: async (newPos) => {
        // A. Cancel outgoing refetches to prevent race conditions
        await queryClient.cancelQueries({ queryKey });

        // B. Snapshot previous state for potential rollback
        const previous = queryClient.getQueryData(queryKey);

        // C. Optimistically update the cache
        queryClient.setQueryData(queryKey, (old) => {
             // ...immutably update 'old' with 'newPos'...
        });

        // D. Return context
        return { previous };
    },
    onError: (err, newPos, context) => {
        // E. Rollback on error
        queryClient.setQueryData(queryKey, context.previous);
        toast.error("Sync failed - retrying...");
    },
    onSettled: () => {
        // F. Eventual Consistency (True Up)
        queryClient.invalidateQueries({ queryKey });
    }
});
```

### 2. Debounce Discipline
For high-frequency events (dragging, resizing, typing), **ALWAYS** decouple the UI update from the Network request.
- **UI State**: Updates in real-time (0ms) via React State / React Flow internal state.
- **Network Request**: Debounced by 500-1000ms.
- **Result**: User sees 60fps movement; Server sees 1 request per drag operation, not 100.

## 🛡️ Edge-Tier Security
- **Strict Typing**: Use Zod schemas or strict TypeScript interfaces for all API responses.
- **Route Guarding**: Protected routes must check session *before* rendering.
- **Transpilation**: When using Monorepo workspace packages (`@workorderpro/database`), ensure `transpilePackages` is set in `next.config.js` or the build will fail silently on "Module not found".

## 📦 Monorepo Integration
- **Imports**: Always import from `@workorderpro/shared` or `@workorderpro/database`, never relative paths traversing up to `../../packages`.
- **Deduplication**: If `pnpm` warnings appear about multiple `react` instances, ensure peer dependencies are correctly defined and versions match exactly.
