# Skill: Operational Handover

Best practices for shift-to-shift communication, ensuring safety compliance and operational continuity during technician transitions.

## Core Principles
1. **The "Clean Hand-off"**: Explicitly documenting open work orders and asset status before ending a shift.
2. **Safety First**: Formal acknowledgement of active LOTO points and hazards.
3. **Accountability**: Digital signatures from both the outgoing and incoming technicians.

## Handover Workflow
1. **Drafting**: Outgoing technician identifies keys issues, downtime events, and safety status.
2. **System Generation**: Automatically pull active/high-priority work orders for the current shift.
3. **Verification**: Incoming technician reviews and acknowledges the report.
4. **Archival**: Reports are immutable once signed and stored for audit compliance.

## Technical Implementation
### ShiftHandover Model
- `outgoingUserId`, `incomingUserId`.
- `shiftType` (Day, Night, etc.).
- `status` (PENDING, SIGNED).
- `content`: JSON structure capturing:
  - `safetyStatus`: Active LOTO/hazards.
  - `activeWorkOrders`: Snapshot of ongoing work.
  - `operationalNotes`: Qualitative context.

### Lifecycle Guards
- Prevent signing if certain mandatory fields (e.g., Safety Notes) are empty.

## UI/UX Best Practices
- **The "Baton Change" UI**: A dual-view dashboard showing what was done vs. what is pending.
- **Mobile Friendliness**: Handovers are often done "on the walk" at the end of a shift.
