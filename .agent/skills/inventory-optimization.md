# Skill: Inventory Optimization

Strategies for managing critical industrial spares, optimizing stock levels, and ensuring operational continuity.

## Core Principles
1. **Criticality-Based Stocking**: Prioritize spares for assets with high RIME risk or criticality.
2. **Min-Max Optimization**:
   - `Min`: Safety stock level based on lead time and usage rate.
   - `Max`: Storage capacity and capital constraints.
3. **Automated Intelligence**: Real-time alerts when stock crosses the `Min` threshold to prevent downtime.

## Technical Implementation
### Stock Adjustment Logic
- All adjustments must be transactional.
- Increment/Decrement quantity and record an `InventoryTransaction` simultaneously.
- Check `minQuantity` after every deduction to trigger `InventoryAlert`.

### Inventory Alerts
- **Critical Alert**: Stock is below 50% of `minQuantity`.
- **Warning**: Stock is below `minQuantity`.
- **Resolved**: Restock transaction brings level back above `minQuantity`.

## Data Model Requirements
- `minQuantity`: User-defined safety threshold.
- `binLocation`: Required for efficient retrieval during outages.
- `sku`: Canonical identifier for procurement.

## UI/UX Best Practices
- **Visual Alerting**: Use high-contrast banners for low stock on both the Inventory board and the Dashboard.
- **Transaction History**: Audit logs for every stock movement (IN, OUT, AUDIT).
