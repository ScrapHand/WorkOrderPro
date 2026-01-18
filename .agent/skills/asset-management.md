# Skill: Asset Management & Hierarchies

## Context
Assets are organized in a tree structure. Effective management requires handling recursive relationships and syncing status based on active work orders.

## Recursive Tree Traversal
1. **Repository Pattern**: Use `PostgresAssetRepository` for data access.
2. **Recursive CTEs**: NEVER use simple `findMany` for deep trees. Use `findSubtree(rootId)` or `findAncestors(assetId)`.
3. **Hierarchy Paths**: The `hierarchyPath` field is a slash-separated string (e.g., `/PLANT-1/PROD-LINE-A/PUMP-04`). Use this for fast path-based filtering.

## Status Synchronization
1. **Automatic Sync**: Call `woService.syncAssetStatus(tenantId, assetId)` after creating or updating a work order.
2. **Logic**:
   - If there is an active `EMERGENCY` or `BREAKDOWN` work order, the asset status should be `DOWN`.
   - If there is an active `PREVENTIVE` or `REPAIR` work order, the asset status should be `MAINTENANCE`.
   - Otherwise, the status is `OPERATIONAL`.

## Provisional Assets
1. **Creation**: When a user creates a work order for an asset that doesn't exist yet, a "Provisional Asset" is created with `status: 'PENDING'`.
2. **Validation**: Ensure `provisionalAssetName` is provided if `assetId` is missing during work order creation.

## Common Pitfalls
- **Infinite Loops**: Always set a max depth (e.g., 20) in recursive CTEs.
- **Dangling Assets**: Ensure that deleting a parent asset handles child assets correctly (cascade or block).
