# Skill: Factory Monitoring & State Projection

## Context
A visual Factory Layout is only useful if it reflects the live state of the operations. This skill covers projecting `Asset` and `WorkOrder` status onto the graph nodes.

## State Mapping
1. **Node Data**: Each node in the `factory-layout` is linked to an `assetId`.
2. **Visual States**:
   - **Operational (Green)**: Asset has `status: OPERATIONAL`.
   - **Down (Red)**: Asset has `status: DOWN`. Indicate active Emergency/Breakdown WOs if possible.
   - **Maintenance (Yellow)**: Asset has `status: MAINTENANCE`.
   - **Locked (Blue/Gray)**: Asset is in LOTO or a restricted state.

## Dynamic Updates
- **Joining Data**: When fetching a layout, the backend should perform a join or the frontend should fetch statuses for all referenced `assetIds` in the graph.
- **Optimistic Sync**: When a work order is created/closed, the layout nodes should transition status immediately in the UI using TanStack Query invalidation.

## Complex Graph States
- **Conveyor Flow**: Edges with `type: CONVEYOR` can indicate flow direction and "congested" states if paired with sensor data.
- **Module Nesting**: Nodes representing modules should summarize the status of their internal components.

## Common Pitfalls
- **Over-fetching**: Don't refetch the entire 1MB graph JSON just to update one status. Use a separate lightweight `/assets/status` endpoint to poll or subscribe to.
- **Z-Index Layering**: Status overlays (icons) must appear above the node body and lines.
