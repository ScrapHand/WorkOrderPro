# Skill: Maintenance Logic & RIME Scoring

## Context
WorkOrderPro uses the RIME (Ranking Index for Maintenance Expenditures) system to prioritize maintenance tasks and manage Preventive Maintenance (PM) schedules.

## RIME Scoring
1. **Formula**: `RIME = Work Class Rank * Asset Criticality Rank`.
2. **Work Class Rank**:
   - `EMERGENCY`: 10
   - `BREAKDOWN`: 9
   - `PREVENTIVE`: 7
   - `REPAIR`: 5
   - `IMPROVEMENT`: 3
3. **Asset Criticality**:
   - `A` (Vital): 10
   - `B` (Essential): 7
   - `C` (Important): 5
4. **Implementation**: Handled in `RIMEService.ts`. ALWAYS calculate RIME before saving a work order to ensure correct sorting in the backlog.

## Preventive Maintenance (PM)
- **Schedules**: Defined in `PMSchedule` model. Can be time-based (intervals) or meter-based.
- **Generation**: A background job or trigger should generate work orders from active PM schedules when the threshold is met.
- **Completion**: Closing a PM work order MUST update the `lastPerformed` date on the schedule.

## ⏱️ Work Order SLAs
Corporate tier provides automated Service Level Agreements (SLAs).
- **Deadlines**: Injected during creation based on priority:
  - `CRITICAL`: 2 hours
  - `HIGH`: 4 hours
  - `MEDIUM`: 12 hours
  - `LOW`: 24 hours
- **Tracking**: Monitored via `slaDeadline` and `slaStatus` (`IN_TARGET`, `AT_RISK`, `BREACHED`).

## Work Order Lifecycle
1. **States**: `OPEN` -> `IN_PROGRESS` -> `ON_HOLD` -> `COMPLETED` -> `CLOSED`.
2. **Assignments**: Work orders can be assigned to individual users or teams.
3. **Audit Trail**: Every status change must be logged in the `AuditLog` table.

## Common Pitfalls
- **Static Scores**: Ensure RIME scores are recalculated if asset criticality changes.
- **Overlapping PMs**: Prevent generating multiple open work orders for the same PM schedule if one is already in progress.
